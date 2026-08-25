import "server-only";

import Stripe from "stripe";
import { connectDb } from "@/lib/db";
import { Order, type OrderDoc, type OrderItemType } from "@/lib/models/order";
import { fulfillOrder, type OrderUser, type HydratedOrder } from "@/lib/orders";

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_") && !key.includes("placeholder");
}

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  return client;
}

export function cancelPathFor(itemType: OrderItemType, itemId: string): string {
  if (itemType === "course") return `/programs/${itemId}/checkout`;
  if (itemType === "seminar") return `/seminars/${itemId}`;
  if (itemType === "resource") return `/resources/${itemId}`;
  return "/dashboard";
}

export async function createCheckoutSession(
  order: OrderDoc,
  opts: { origin: string; email?: string | null; cancelPath?: string }
): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Payment provider is not configured");
  if (!order.items[0]) throw new Error("Order has no items");

  const item = order.items[0];
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(opts.email ? { customer_email: opts.email } : {}),
      client_reference_id: order._id.toString(),
      metadata: { orderId: order._id.toString() },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (order.currency ?? "BDT").toLowerCase(),
            unit_amount: Math.round((order.total ?? 0) * 100),
            product_data: { name: item.title || "FlyBridge purchase" },
          },
        },
      ],
      success_url: `${opts.origin}/payment/success?order=${order._id.toString()}`,
      cancel_url: `${opts.origin}${opts.cancelPath ?? cancelPathFor(item.itemType, item.itemId)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/must convert to at least|below the minimum/i.test(message)) {
      throw new Error(
        "This amount is below the payment processor's minimum charge (around 60 BDT). Please use a higher amount."
      );
    }
    throw error;
  }

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url, sessionId: session.id };
}

export type ReconcileResult = {
  status: OrderDoc["status"] | "unknown";
  orderId: string;
  itemType?: OrderItemType;
  itemId?: string;
};

export async function reconcileOrder(
  orderId: string,
  viewer: OrderUser & { isAdmin?: boolean }
): Promise<ReconcileResult> {
  await connectDb();

  const existing = await Order.findById(orderId);
  if (!existing) throw new Error("Order not found");
  if (existing.user.toString() !== viewer.id && !viewer.isAdmin) {
    throw new Error("Forbidden");
  }

  if (existing.status !== "pending") {
    const it = existing.items[0];
    return {
      status: existing.status,
      orderId,
      itemType: it?.itemType,
      itemId: it?.itemId,
    };
  }

  const stripe = getStripe();
  if (!stripe || existing.gateway !== "stripe" || !existing.gatewayRef) {
    const it = existing.items[0];
    return {
      status: existing.status,
      orderId,
      itemType: it?.itemType,
      itemId: it?.itemId,
    };
  }

  let paid = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(existing.gatewayRef);
    paid =
      session.payment_status === "paid" ||
      (session.status === "complete" && session.payment_status !== "unpaid");
    if (session.status === "expired" && !paid) {
      existing.status = "failed";
      await existing.save();
      return { status: "failed", orderId };
    }
  } catch (error) {
    console.error("stripe reconcile retrieve error", error);
  }

  if (paid) {
    const fresh = (await Order.findById(orderId)) as HydratedOrder | null;
    if (fresh && fresh.status === "pending") {
      await fulfillOrder(fresh);
      const it = fresh.items[0];
      return {
        status: "completed",
        orderId,
        itemType: it?.itemType,
        itemId: it?.itemId,
      };
    }
  }

  const it = existing.items[0];
  return {
    status: existing.status,
    orderId,
    itemType: it?.itemType,
    itemId: it?.itemId,
  };
}
