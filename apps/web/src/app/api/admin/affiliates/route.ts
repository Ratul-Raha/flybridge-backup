import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";
import { AffiliateClick } from "@/lib/models/affiliate-click";
import {
  generateAffiliateCode,
  normalizeAffiliateCode,
  parsePayoutDetails,
  serializeAffiliate,
} from "@/lib/affiliate";
import { emitEvent } from "@/lib/events/emit";

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const [affiliates, conversionRows, clickRows] = await Promise.all([
      Affiliate.find().sort({ createdAt: -1 }).lean(),
      AffiliateConversion.aggregate<{
        _id: { affiliate: Types.ObjectId; currency: string; status: string };
        amount: number;
        count: number;
        orderTotal: number;
      }>([
        {
          $group: {
            _id: { affiliate: "$affiliate", currency: "$currency", status: "$status" },
            amount: { $sum: "$commissionAmount" },
            count: { $sum: 1 },
            orderTotal: { $sum: "$orderTotal" },
          },
        },
      ]),
      AffiliateClick.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $group: { _id: "$affiliate", count: { $sum: 1 } } },
      ]),
    ]);

    const totalsByAffiliate = new Map<string, Record<string, { pending: number; approved: number; paid: number; reversed: number; conversions: number; orderTotal: number }>>();
    for (const row of conversionRows) {
      const key = row._id.affiliate.toString();
      const byCurrency = totalsByAffiliate.get(key) ?? {};
      const currency = (row._id.currency ?? "USD").toUpperCase();
      const totals = (byCurrency[currency] ??= {
        pending: 0,
        approved: 0,
        paid: 0,
        reversed: 0,
        conversions: 0,
        orderTotal: 0,
      });
      totals.conversions += row.count;
      totals.orderTotal += row.orderTotal;
      if (row._id.status === "pending") totals.pending += row.amount;
      else if (row._id.status === "approved") totals.approved += row.amount;
      else if (row._id.status === "paid") totals.paid += row.amount;
      else if (row._id.status === "reversed") totals.reversed += row.amount;
      totalsByAffiliate.set(key, byCurrency);
    }

    const clicksByAffiliate = new Map(clickRows.map((row) => [row._id.toString(), row.count]));

    const list = affiliates.map((affiliate) => ({
      ...serializeAffiliate(affiliate as unknown as Record<string, unknown>),
      clicks: clicksByAffiliate.get(affiliate._id.toString()) ?? 0,
      totals: totalsByAffiliate.get(affiliate._id.toString()) ?? {},
    }));

    return NextResponse.json({ affiliates: list });
  } catch (error) {
    console.error("admin affiliates GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "A name is required" }, { status: 400 });

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const percent =
      typeof body.commissionPercent === "number"
        ? body.commissionPercent
        : Number(body.commissionPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return NextResponse.json(
        { error: "Commission percent must be between 0 and 100" },
        { status: 400 }
      );
    }
    const currency = body.currency === "USD" ? "USD" : "BDT";

    await connectDb();

    let code = normalizeAffiliateCode(body.code);
    if (code) {
      if (!CODE_PATTERN.test(code)) {
        return NextResponse.json(
          { error: "Code must be 2-30 characters: letters, numbers, dash or underscore" },
          { status: 400 }
        );
      }
      if (await Affiliate.exists({ code })) {
        return NextResponse.json({ error: "That code is already in use" }, { status: 409 });
      }
    } else {
      code = await generateAffiliateCode(email || name);
    }

    const userId =
      typeof body.userId === "string" && Types.ObjectId.isValid(body.userId)
        ? body.userId
        : null;

    const affiliate = await Affiliate.create({
      name,
      email,
      phone,
      code,
      status: "active",
      commissionPercent: Math.round(percent * 100) / 100,
      currency,
      payoutMethod: parsePayoutDetails(body.payoutDetails).method,
      payoutDetails: parsePayoutDetails(body.payoutDetails),
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "",
      user: userId,
      createdBy: session.userId,
    });

    await emitEvent("affiliate.created", {
      affiliate: {
        id: affiliate._id.toString(),
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email ?? null,
      },
      actor: { userId: session.userId, name: session.name, email: session.email },
    });

    return NextResponse.json(
      { affiliate: serializeAffiliate(affiliate as unknown as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "That code is already in use" }, { status: 409 });
    }
    console.error("admin affiliates POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
