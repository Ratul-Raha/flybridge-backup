import "server-only";

import Stripe from "stripe";
import { connectDb } from "@/lib/db";
import { Order, type OrderDoc, type OrderItemType } from "@/lib/models/order";
import { fulfillOrder, type HydratedOrder } from "@/lib/orders";
import { loadPaymentSettings, type StripeMode } from "@/lib/payments/settings";
import type { ReconcileResult } from "@/lib/payments/types";

function keyForMode(mode: StripeMode): string {
  if (mode === "live") return process.env.STRIPE_SECRET_KEY ?? "";
  return process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "";
}

function keyMatchesMode(mode: StripeMode, key: string): boolean {
  if (!key || key.includes("placeholder")) return false;
  return mode === "live" ? key.startsWith("sk_live_") : key.startsWith("sk_test_");
}

const clients: Partial<Record<StripeMode, { client: Stripe; key: string }>> = {};

function clientForMode(mode: StripeMode): Stripe | null {
  const key = keyForMode(mode);
  if (!keyMatchesMode(mode, key)) return null;
  const cached = clients[mode];
  if (cached && cached.key === key) return cached.client;
  const client = new Stripe(key);
  clients[mode] = { client, key };
  return client;
}

export async function currentStripeMode(): Promise<StripeMode> {
  const { stripeMode } = await loadPaymentSettings();
  return stripeMode;
}

export function asStripeMode(value: string | null | undefined): StripeMode | null {
  return value === "live" || value === "test" ? value : null;
}

export async function isStripeConfigured(mode?: StripeMode): Promise<boolean> {
  const m = mode ?? (await currentStripeMode());
  return keyMatchesMode(m, keyForMode(m));
}

export async function getStripe(mode?: StripeMode): Promise<Stripe | null> {
  return clientForMode(mode ?? (await currentStripeMode()));
}

export function cancelPathFor(itemType: OrderItemType, itemId: string): string {
  if (itemType === "course") return `/programs/${itemId}/checkout`;
  if (itemType === "seminar") return `/seminars/${itemId}`;
  if (itemType === "resource") return `/resources/${itemId}`;
  if (itemType === "mock-bundle") return `/mock-tests/${itemId}`;
  return "/dashboard";
}

export async function createCheckoutSession(
  order: OrderDoc,
  opts: { origin: string; email?: string | null; cancelPath?: string }
): Promise<{ url: string; sessionId: string; mode: StripeMode }> {
  const mode = await currentStripeMode();
  const stripe = await getStripe(mode);
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
            currency: (order.currency ?? "USD").toLowerCase(),
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
        "This amount is below the payment processor's minimum charge (around US$0.50). Please use a higher amount."
      );
    }
    throw error;
  }

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url, sessionId: session.id, mode };
}

export async function reconcileStripeOrder(
  existing: HydratedOrder,
  viewer: { id: string; isAdmin?: boolean }
): Promise<ReconcileResult> {
  await connectDb();

  const item = existing.items[0];
  const base = {
    orderId: existing._id.toString(),
    itemType: item?.itemType,
    itemId: item?.itemId,
  } satisfies Omit<ReconcileResult, "status">;

  const mode = asStripeMode(existing.gatewayMode) ?? (await currentStripeMode());
  const stripe = await getStripe(mode);
  if (!stripe || existing.gateway !== "stripe" || !existing.gatewayRef) {
    return { status: existing.status, ...base };
  }

  let paid = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(existing.gatewayRef);
    paid =
      session.payment_status === "paid" ||
      (session.status === "complete" && session.payment_status !== "unpaid");
    if (session.status === "expired" && !paid) {
      if (existing.status === "pending") {
        existing.status = "failed";
        await existing.save();
      }
      return { status: "failed", ...base };
    }
  } catch (error) {
    console.error("stripe reconcile retrieve error", error);
  }

  if (paid) {
    const fresh = (await Order.findById(existing._id)) as HydratedOrder | null;
    if (fresh && fresh.status === "pending") {
      await fulfillOrder(fresh);
      const it = fresh.items[0];
      return {
        status: "completed",
        orderId: fresh._id.toString(),
        itemType: it?.itemType,
        itemId: it?.itemId,
      };
    }
    return { status: fresh?.status ?? "unknown", ...base };
  }

  return { status: existing.status, ...base };
}

export type StripeRefundResult = {
  ok: boolean;
  refundId?: string;
  error?: string;
  /** False when the gateway cannot pay out on its own and a human must. */
  automatic: boolean;
};

/**
 * Refunds a paid Stripe order in full. The order stores the Checkout *session*
 * id, so the payment intent has to be looked up before the refund can be made.
 */
export async function refundStripeOrder(
  order: Pick<OrderDoc, "gateway" | "gatewayRef" | "gatewayMode" | "_id">
): Promise<StripeRefundResult> {
  if (order.gateway !== "stripe") {
    return { ok: false, automatic: false, error: "Not a Stripe order" };
  }
  if (!order.gatewayRef) {
    return { ok: false, automatic: false, error: "Order has no Stripe session reference" };
  }

  const mode = asStripeMode(order.gatewayMode) ?? (await currentStripeMode());
  const stripe = await getStripe(mode);
  if (!stripe) {
    return { ok: false, automatic: false, error: "Stripe is not configured" };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(order.gatewayRef);
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntent) {
      return { ok: false, automatic: false, error: "No payment intent on this session" };
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
      metadata: { orderId: order._id.toString() },
    });
    return { ok: true, automatic: true, refundId: refund.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe refund failed";
    console.error("stripe refund error", error);
    return { ok: false, automatic: true, error: message };
  }
}
