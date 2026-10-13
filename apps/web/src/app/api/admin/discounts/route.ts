import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Coupon } from "@/lib/models/coupon";
import { Order } from "@/lib/models/order";
import { parseCouponInput } from "@/lib/coupon-rules";

function serializeCoupon(coupon: Record<string, any>, redemptions = 0) {
  return {
    id: coupon._id.toString(),
    name: coupon.name,
    description: coupon.description ?? "",
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    currency: coupon.currency ?? "BDT",
    appliesTo: coupon.appliesTo ?? "all",
    minSubtotal: coupon.minSubtotal ?? 0,
    maxRedemptions: coupon.maxRedemptions ?? null,
    maxUsesPerUser: coupon.maxUsesPerUser ?? 1,
    startsAt: coupon.startsAt ?? null,
    endsAt: coupon.endsAt ?? null,
    active: coupon.active ?? true,
    redemptions,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const [coupons, counts] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: { couponId: { $ne: null }, status: { $in: ["pending", "completed"] } } },
        { $group: { _id: "$couponId", count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = new Map(counts.map((count) => [count._id.toString(), count.count as number]));

    return NextResponse.json({
      coupons: coupons.map((coupon) =>
        serializeCoupon(coupon as unknown as Record<string, any>, countMap.get(coupon._id.toString()) ?? 0)
      ),
    });
  } catch (error) {
    console.error("admin discounts GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const input = parseCouponInput(await request.json());
    if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

    await connectDb();
    if (await Coupon.exists({ code: input.code })) {
      return NextResponse.json({ error: "That coupon code is already in use" }, { status: 409 });
    }
    const coupon = await Coupon.create({
      ...input,
      createdBy: session.userId,
      updatedBy: session.userId,
    });
    return NextResponse.json({ coupon: serializeCoupon(coupon as unknown as Record<string, any>) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "That coupon code is already in use" }, { status: 409 });
    }
    console.error("admin discounts POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
