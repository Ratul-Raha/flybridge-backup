import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { connectDb } from "@/lib/db";
import { getStripe } from "@/lib/payments/stripe";
import { Order, type OrderItemType } from "@/lib/models/order";
import { fulfillOrder, type HydratedOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const candidates = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_TEST,
  ].filter((secret): secret is string => !!secret && !secret.includes("placeholder"));

  if (candidates.length === 0) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe =
    (await getStripe()) ?? (await getStripe("live")) ?? (await getStripe("test"));
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event | null = null;
  for (const secret of candidates) {
    try {
      event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
      break;
    } catch {
      // try the next configured secret (test vs live)
    }
  }
  if (!event) {
    console.error("stripe webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (!orderId) break;
        await connectDb();
        const fresh = (await Order.findById(orderId)) as HydratedOrder | null;
        if (fresh && fresh.status === "pending") {
          await fulfillOrder(fresh);
        }
        break;
      }
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const obj = event.data.object as { metadata?: { orderId?: string }; client_reference_id?: string | null };
        const orderId = obj.metadata?.orderId ?? obj.client_reference_id;
        if (!orderId) break;
        await connectDb();
        const fresh = await Order.findById(orderId);
        if (fresh && fresh.status === "pending") {
          fresh.status = "failed";
          await fresh.save();
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("stripe webhook handler error", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
