import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Affiliate, AFFILIATE_STATUSES } from "@/lib/models/affiliate";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";
import { AffiliatePayout } from "@/lib/models/affiliate-payout";
import { serializeAffiliate, normalizeAffiliateCode, parsePayoutDetails } from "@/lib/affiliate";
import { computeAffiliateTotals, countAffiliateClicks } from "@/lib/affiliate-stats";

function serializeConversion(doc: Record<string, unknown>) {
  return {
    id: String((doc._id as { toString(): string }).toString()),
    orderId: doc.order ? String(doc.order) : null,
    itemType: doc.itemType ?? null,
    itemId: doc.itemId ?? null,
    itemTitle: doc.itemTitle ?? "",
    orderTotal: doc.orderTotal ?? 0,
    currency: doc.currency ?? "USD",
    commissionPercent: doc.commissionPercent ?? 0,
    commissionAmount: doc.commissionAmount ?? 0,
    status: doc.status,
    availableAt: doc.availableAt ?? null,
    createdAt: doc.createdAt,
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const affiliate = await Affiliate.findById(params.id).lean();
    if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

    const [totals, clicks, conversions, payouts] = await Promise.all([
      computeAffiliateTotals(params.id),
      countAffiliateClicks(params.id),
      AffiliateConversion.find({ affiliate: params.id }).sort({ createdAt: -1 }).limit(200).lean(),
      AffiliatePayout.find({ affiliate: params.id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    return NextResponse.json({
      affiliate: serializeAffiliate(affiliate as unknown as Record<string, unknown>),
      totals,
      clicks,
      conversions: conversions.map((c) => serializeConversion(c as unknown as Record<string, unknown>)),
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
    console.error("admin affiliate detail GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();
    const affiliate = await Affiliate.findById(params.id);
    if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

    if (typeof body.name === "string" && body.name.trim()) affiliate.name = body.name.trim();
    if (typeof body.email === "string") affiliate.email = body.email.trim().toLowerCase();
    if (typeof body.phone === "string") affiliate.phone = body.phone.trim();

    if (body.commissionPercent !== undefined) {
      const percent = Number(body.commissionPercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return NextResponse.json(
          { error: "Commission percent must be between 0 and 100" },
          { status: 400 }
        );
      }
      affiliate.commissionPercent = Math.round(percent * 100) / 100;
    }

    if (body.currency === "USD" || body.currency === "BDT") affiliate.currency = body.currency;

    if (typeof body.status === "string" && AFFILIATE_STATUSES.includes(body.status as never)) {
      affiliate.status = body.status as never;
      affiliate.suspendedAt = body.status === "suspended" ? new Date() : null;
    }

    if (body.payoutDetails !== undefined || body.payoutMethod !== undefined) {
      const details = parsePayoutDetails({
        ...(body.payoutDetails as Record<string, unknown> | undefined),
        method: (body.payoutDetails as Record<string, unknown> | undefined)?.method ?? body.payoutMethod,
      });
      affiliate.payoutMethod = details.method;
      affiliate.payoutDetails = details;
    }

    if (typeof body.notes === "string") affiliate.notes = body.notes.trim().slice(0, 1000);

    // The code is intentionally immutable — links are already in the wild.
    if (typeof body.code === "string" && normalizeAffiliateCode(body.code) !== affiliate.code) {
      return NextResponse.json({ error: "The affiliate code cannot be changed" }, { status: 400 });
    }

    await affiliate.save();
    return NextResponse.json({
      affiliate: serializeAffiliate(affiliate as unknown as Record<string, unknown>),
    });
  } catch (error) {
    console.error("admin affiliate PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const affiliate = await Affiliate.findById(params.id);
    if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

    // An affiliate with ledger history is suspended rather than erased, so the
    // commissions they earned stay intact.
    const hasHistory = await AffiliateConversion.exists({ affiliate: affiliate._id });
    if (hasHistory) {
      affiliate.status = "suspended";
      affiliate.suspendedAt = new Date();
      await affiliate.save();
      return NextResponse.json({ ok: true, suspended: true });
    }

    await affiliate.deleteOne();
    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error("admin affiliate DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
