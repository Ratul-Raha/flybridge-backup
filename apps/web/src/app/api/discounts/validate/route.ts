import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { CouponError } from "@/lib/coupons";
import { resolveCheckoutPricing } from "@/lib/checkout-pricing";
import { Order, ORDER_ITEM_TYPES, type OrderItemType } from "@/lib/models/order";
import { priceInCurrency, resolveProduct } from "@/lib/products";

function isOrderItemType(value: unknown): value is OrderItemType {
  return typeof value === "string" && (ORDER_ITEM_TYPES as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to apply a coupon code." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!isOrderItemType(body.itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
    if (typeof body.itemId !== "string" || !body.itemId.trim()) {
      return NextResponse.json({ error: "An item is required" }, { status: 400 });
    }
    if (typeof body.code !== "string" || !body.code.trim()) {
      return NextResponse.json({ error: "Enter a coupon code" }, { status: 400 });
    }

    await connectDb();
    const product = await resolveProduct(body.itemType, body.itemId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const { amount, currency } = priceInCurrency(
      product,
      typeof body.currency === "string" ? body.currency : undefined
    );
    const pendingOrder = await Order.findOne({
      user: session.userId,
      items: { $elemMatch: { itemType: product.itemType, itemId: product.itemId } },
      status: "pending",
    })
      .select("_id")
      .lean();
    const pricing = await resolveCheckoutPricing({
      user: { id: session.userId, email: session.email ?? "" },
      product,
      amount,
      currency,
      code: body.code,
      excludeOrderId: pendingOrder?._id.toString(),
    });

    return NextResponse.json({
      code: pricing.discountCode,
      label: pricing.couponLabel,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      couponDiscount: pricing.couponDiscount,
      total: pricing.total,
      currency,
    });
  } catch (error) {
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not validate the coupon";
    const status = message === "Product not found" ? 404 : 400;
    console.error("discounts validate error", error);
    return NextResponse.json({ error: message }, { status });
  }
}
