import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Coupon } from "@/lib/models/coupon";
import { Order } from "@/lib/models/order";
import { parseCouponInput } from "@/lib/coupon-rules";

function serializeCoupon(coupon: Record<string, any>) {
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
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  try {
    const input = parseCouponInput(await request.json());
    if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

    await connectDb();
    if (await Coupon.exists({ code: input.code, _id: { $ne: params.id } })) {
      return NextResponse.json({ error: "That coupon code is already in use" }, { status: 409 });
    }
    const coupon = await Coupon.findByIdAndUpdate(
      params.id,
      { $set: { ...input, updatedBy: session.userId } },
      { new: true, runValidators: true }
    );
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ coupon: serializeCoupon(coupon as unknown as Record<string, any>) });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "That coupon code is already in use" }, { status: 409 });
    }
    console.error("admin discounts PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  try {
    await connectDb();
    const coupon = await Coupon.findById(params.id);
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    const hasOrders = await Order.exists({
      couponId: coupon._id,
      status: { $in: ["pending", "completed"] },
    });
    if (hasOrders) {
      coupon.active = false;
      coupon.updatedBy = new Types.ObjectId(session.userId);
      await coupon.save();
      return NextResponse.json({ ok: true, deactivated: true });
    }

    await coupon.deleteOne();
    return NextResponse.json({ ok: true, deactivated: false });
  } catch (error) {
    console.error("admin discounts DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
