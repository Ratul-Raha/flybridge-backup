import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";
import { AffiliatePayout } from "@/lib/models/affiliate-payout";
import { approveDueConversions } from "@/lib/affiliate-commission";
import { emitEvent } from "@/lib/events/emit";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const payouts = await AffiliatePayout.find({ affiliate: params.id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      payouts: payouts.map((p) => ({
        id: p._id.toString(),
        amount: p.amount ?? 0,
        currency: p.currency ?? "BDT",
        method: p.method ?? "bKash",
        reference: p.reference ?? "",
        status: p.status,
        conversions: (p.conversions ?? []).length,
        notes: p.notes ?? "",
        paidAt: p.paidAt ?? null,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("admin affiliate payouts GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/**
 * Records a manual payout and marks the included commissions paid. No money is
 * moved here — staff send the transfer first, then log it with a reference.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();

    const affiliate = await Affiliate.findById(params.id);
    if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

    // Make sure anything whose hold window has passed is eligible first.
    await approveDueConversions(params.id);

    const selectedIds = Array.isArray(body.conversionIds)
      ? body.conversionIds.filter((id): id is string => typeof id === "string")
      : null;

    const eligible = await AffiliateConversion.find({
      affiliate: affiliate._id,
      status: "approved",
      currency: affiliate.currency,
      ...(selectedIds ? { _id: { $in: selectedIds } } : {}),
    }).lean();

    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "No approved commissions are ready to pay out" },
        { status: 400 }
      );
    }

    const amount = eligible.reduce((sum, c) => sum + (c.commissionAmount ?? 0), 0);
    const method =
      typeof body.method === "string" && body.method.trim()
        ? body.method.trim()
        : affiliate.payoutMethod ?? "bKash";
    const reference = typeof body.reference === "string" ? body.reference.trim().slice(0, 200) : "";
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";

    const payout = await AffiliatePayout.create({
      affiliate: affiliate._id,
      amount: Math.round(amount * 100) / 100,
      currency: affiliate.currency,
      method,
      reference,
      conversions: eligible.map((c) => c._id),
      status: "paid",
      notes,
      processedBy: session.userId,
      paidAt: new Date(),
    });

    await AffiliateConversion.updateMany(
      { _id: { $in: eligible.map((c) => c._id) } },
      { $set: { status: "paid", payout: payout._id } }
    );

    await emitEvent("affiliate.payout", {
      affiliate: {
        id: affiliate._id.toString(),
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email ?? null,
      },
      payout: {
        id: payout._id.toString(),
        amount: payout.amount ?? 0,
        currency: payout.currency ?? "BDT",
        method: payout.method ?? null,
        conversions: eligible.length,
      },
      actor: { userId: session.userId, name: session.name, email: session.email },
    });

    return NextResponse.json(
      {
        payout: {
          id: payout._id.toString(),
          amount: payout.amount,
          currency: payout.currency,
          method: payout.method,
          reference: payout.reference,
          conversions: eligible.length,
          status: payout.status,
          paidAt: payout.paidAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("admin affiliate payout POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
