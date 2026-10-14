import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";
import { AffiliatePayout } from "@/lib/models/affiliate-payout";
import { affiliateLink, findAffiliateForSession, serializeAffiliate } from "@/lib/affiliate";
import { approveDueConversions } from "@/lib/affiliate-commission";
import { computeAffiliateTotals, countAffiliateClicks } from "@/lib/affiliate-stats";

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const affiliate = await findAffiliateForSession(session);

    if (!affiliate) {
      return NextResponse.json({ affiliate: null });
    }

    await approveDueConversions(affiliate._id.toString());

    const [totals, clicks, conversions, payouts] = await Promise.all([
      computeAffiliateTotals(affiliate._id.toString()),
      countAffiliateClicks(affiliate._id.toString()),
      AffiliateConversion.find({ affiliate: affiliate._id }).sort({ createdAt: -1 }).limit(100).lean(),
      AffiliatePayout.find({ affiliate: affiliate._id }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    return NextResponse.json({
      affiliate: serializeAffiliate(affiliate as unknown as Record<string, unknown>),
      link: affiliateLink(request.nextUrl.origin, affiliate.code),
      totals,
      clicks,
      conversions: conversions.map((c) => ({
        id: c._id.toString(),
        orderId: c.order ? String(c.order) : null,
        itemTitle: c.itemTitle ?? "",
        itemType: c.itemType ?? null,
        orderTotal: c.orderTotal ?? 0,
        currency: c.currency ?? "USD",
        commissionPercent: c.commissionPercent ?? 0,
        commissionAmount: c.commissionAmount ?? 0,
        status: c.status,
        availableAt: c.availableAt ?? null,
        createdAt: c.createdAt,
      })),
      payouts: payouts.map((p) => ({
        id: p._id.toString(),
        amount: p.amount ?? 0,
        currency: p.currency ?? "BDT",
        method: p.method ?? "bKash",
        reference: p.reference ?? "",
        status: p.status,
        conversions: (p.conversions ?? []).length,
        paidAt: p.paidAt ?? null,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("affiliate me GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
