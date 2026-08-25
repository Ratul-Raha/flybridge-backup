import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { connectDb } from "@/lib/db";
import { getStripe } from "@/lib/payments/stripe";
import { Order, type OrderItemType } from "@/lib/models/order";
import { fulfillOrder, type HydratedOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("stripe webhook signature verification failed", error);
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
