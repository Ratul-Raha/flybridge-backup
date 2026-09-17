import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { resolveProduct, priceInCurrency } from "@/lib/products";
import { resolvePrice, DiscountError } from "@/lib/discounts";
import { ORDER_ITEM_TYPES, type OrderItemType } from "@/lib/models/order";

function isOrderItemType(value: unknown): value is OrderItemType {
  return typeof value === "string" && (ORDER_ITEM_TYPES as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!isOrderItemType(body.itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
    if (typeof body.itemId !== "string" || !body.itemId.trim()) {
      return NextResponse.json({ error: "An item is required" }, { status: 400 });
    }

    await connectDb();
    const product = await resolveProduct(body.itemType, body.itemId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { amount, currency } = priceInCurrency(
      product,
      typeof body.currency === "string" ? body.currency : undefined
    );

    const resolved = await resolvePrice({
      user: { id: session.userId, email: session.email ?? "" },
      product,
      amount,
      currency,
      code: typeof body.code === "string" ? body.code : undefined,
    });

    return NextResponse.json({
      subtotal: resolved.subtotal,
      discount: resolved.discount,
      total: resolved.total,
      label: resolved.label ?? null,
      code: resolved.code ?? null,
      currency,
    });
  } catch (error) {
    if (error instanceof DiscountError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("discounts validate error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
