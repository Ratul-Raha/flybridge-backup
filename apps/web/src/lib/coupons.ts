import "server-only";

import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { Coupon } from "@/lib/models/coupon";
import { Order } from "@/lib/models/order";
import {
  calculateCouponDiscount,
  couponEligibilityError,
  normalizeCouponCode,
  type CouponRule,
} from "@/lib/coupon-rules";
import type { OrderItemType } from "@/lib/models/order";

export class CouponError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "CouponError";
  }
}

export async function applyCoupon(input: {
  code: string;
  userId: string;
  itemType: OrderItemType;
  currency: string;
  amount: number;
  excludeOrderId?: string;
}): Promise<{
  couponId: Types.ObjectId;
  code: string;
  name: string;
  discount: number;
  total: number;
} | null> {
  const code = normalizeCouponCode(input.code);
  if (!code) return null;
  if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) {
    throw new CouponError("This coupon code is not valid.");
  }

  await connectDb();
  const coupon = await Coupon.findOne({ code }).lean();
  if (!coupon) throw new CouponError("This coupon code is not valid.");

  const excludeId =
    input.excludeOrderId && Types.ObjectId.isValid(input.excludeOrderId)
      ? new Types.ObjectId(input.excludeOrderId)
      : null;
  const useFilter = {
    couponId: coupon._id,
    status: { $in: ["pending", "completed"] as const },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  };
  const [redemptions, userRedemptions] = await Promise.all([
    Order.countDocuments(useFilter),
    Order.countDocuments({ ...useFilter, user: input.userId }),
  ]);

  const rule: CouponRule = {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    currency: coupon.currency as "USD" | "BDT",
    appliesTo: coupon.appliesTo,
    minSubtotal: coupon.minSubtotal ?? 0,
    maxRedemptions: coupon.maxRedemptions ?? null,
    maxUsesPerUser: coupon.maxUsesPerUser ?? 1,
    startsAt: coupon.startsAt ?? null,
    endsAt: coupon.endsAt ?? null,
    active: coupon.active,
  };
  const eligibilityError = couponEligibilityError(rule, {
    itemType: input.itemType,
    currency: input.currency,
    eligibleSubtotal: input.amount,
    redemptions,
    userRedemptions,
  });
  if (eligibilityError) throw new CouponError(eligibilityError);

  const discount = calculateCouponDiscount(rule, input.amount, input.currency);
  if (discount <= 0) throw new CouponError("This coupon cannot be applied to this order.");

  return {
    couponId: coupon._id,
    code: coupon.code,
    name: coupon.name,
    discount,
    total: Math.round((input.amount - discount) * 100) / 100,
  };
}
