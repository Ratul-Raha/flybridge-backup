import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliatePayout } from "@/lib/models/affiliate-payout";

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

    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
    const limit = Math.min(100, Number(request.nextUrl.searchParams.get("limit")) || 50);
    const skip = (page - 1) * limit;

    const [payouts] = await Promise.all([
      AffiliatePayout.find({ affiliate: affiliate._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
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
    console.error("affiliate me payouts GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
