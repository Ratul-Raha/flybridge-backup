import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";
import { AffiliateClick } from "@/lib/models/affiliate-click";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const [affiliates, convs, clicks] = await Promise.all([
      Affiliate.countDocuments({ status: "active" }),
      AffiliateConversion.aggregate<{
        _id: { currency: string; status: string };
        amount: number;
        count: number;
      }>([
        { $group: { _id: { currency: "$currency", status: "$status" }, amount: { $sum: "$commissionAmount" }, count: { $sum: 1 } } },
      ]),
      AffiliateClick.countDocuments(),
    ]);

    const totalClicks = clicks;
    let conversions = 0;
    let unpaid = 0;
    let pending = 0;
    let paid = 0;
    for (const c of convs) {
      conversions += c.count;
      if (c._id.status === "pending") pending += c.amount;
      else if (c._id.status === "approved") unpaid += c.amount;
      else if (c._id.status === "paid") paid += c.amount;
    }

    return NextResponse.json({
      activeAffiliates: affiliates,
      clicks: totalClicks,
      conversions,
      unpaid,
      pending,
      paid,
    });
  } catch (error) {
    console.error("admin affiliates stats GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
