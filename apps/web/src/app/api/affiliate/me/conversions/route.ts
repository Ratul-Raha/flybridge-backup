import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";
import { AffiliatePayout } from "@/lib/models/affiliate-payout";
import { approveDueConversions } from "@/lib/affiliate-commission";
import { computeAffiliateTotals, countAffiliateClicks } from "@/lib/affiliate-stats";

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const affiliate = await Affiliate.findOne({
      $or: [{ user: session.userId }, { email: session.email?.toLowerCase() }],
    }).lean();
    if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

    await approveDueConversions(affiliate._id.toString());
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
    const limit = Math.min(100, Number(request.nextUrl.searchParams.get("limit")) || 50);
    const skip = (page - 1) * limit;

    const [conversions, totals, clicks] = await Promise.all([
      AffiliateConversion.find({ affiliate: affiliate._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      computeAffiliateTotals(affiliate._id.toString()),
      countAffiliateClicks(affiliate._id.toString()),
    ]);

    return NextResponse.json({
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
      totals,
      clicks,
    });
  } catch (error) {
    console.error("affiliate me conversions GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
