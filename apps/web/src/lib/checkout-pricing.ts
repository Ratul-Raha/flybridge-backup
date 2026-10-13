import "server-only";

import { resolveCoursePrice } from "@/lib/course-discount";
import { applyCoupon } from "@/lib/coupons";
import { resolveWishlistDiscount } from "@/lib/wishlist-discount";
import { roundMoney } from "@/lib/wishlist";
import type { Product } from "@/lib/products";

export async function resolveCheckoutPricing(input: {
  user: { id: string; email: string };
  product: Product;
  amount: number;
  currency: string;
  code?: string | null;
  excludeOrderId?: string;
}) {
  const coursePrice =
    input.product.itemType === "course"
      ? resolveCoursePrice(input.amount, input.product.discount)
      : { price: input.amount, originalPrice: null, savings: 0, label: null };

  const wishlist = await resolveWishlistDiscount({
    itemType: input.product.itemType,
    itemId: input.product.itemId,
    userId: input.user.id,
    email: input.user.email,
    price: coursePrice.price,
  });
  const beforeCoupon = roundMoney(wishlist?.price ?? coursePrice.price);
  const coupon = input.code?.trim()
    ? await applyCoupon({
        code: input.code,
        userId: input.user.id,
        itemType: input.product.itemType,
        currency: input.currency,
        amount: beforeCoupon,
        excludeOrderId: input.excludeOrderId,
      })
    : null;
  const total = coupon?.total ?? beforeCoupon;
  const labels = [
    coursePrice.label,
    wishlist?.percent ? `Wishlist ${wishlist.percent}%` : null,
    coupon?.name,
  ].filter((label): label is string => Boolean(label));

  return {
    subtotal: roundMoney(input.amount),
    courseDiscount: roundMoney(input.amount - coursePrice.price),
    wishlistDiscount: wishlist?.amount ?? 0,
    couponDiscount: coupon?.discount ?? 0,
    discount: roundMoney(input.amount - total),
    total,
    couponId: coupon?.couponId ?? null,
    discountCode: coupon?.code ?? null,
    couponLabel: coupon?.name ?? null,
    discountLabel: labels.length > 0 ? labels.join(" · ") : null,
  };
}
