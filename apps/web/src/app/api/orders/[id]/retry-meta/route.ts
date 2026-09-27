import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order } from "@/lib/models/order";
import { User } from "@/lib/models/user";
import { isMetaPurchaseEnabled } from "@/lib/meta-capi";
import { reportOrderPurchase, type HydratedOrder } from "@/lib/orders";

/**
 * Re-sends a completed order's Purchase event to Meta.
 *
 * Catches the two cases the dashboard flags: a delivery that failed (timeout,
 * rejected payload — hover the badge for the reason) and one that never happened
 * because the token was missing. Safe to call repeatedly: `event_id` is the order
 * id, so Meta collapses duplicates instead of counting the sale twice.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isMetaPurchaseEnabled()) {
    return NextResponse.json(
      { error: "Meta Conversions API is not configured (META_CAPI_TOKEN missing)" },
      { status: 503 }
    );
  }

  try {
    await connectDb();

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "completed") {
      return NextResponse.json(
        { error: "Only completed orders report a Purchase" },
        { status: 400 }
      );
    }

    // fulfillOrder has the buyer's phone in hand from the checkout; a retry
    // happens later, so read it back — Meta matches on `ph` and dropping it
    // costs match quality on the one event that already needed re-sending.
    const user = await User.findById(order.user).select("phone").lean();
    const result = await reportOrderPurchase(order as HydratedOrder, {
      phone: user?.phone ?? null,
    });
    if (!result.reported) {
      return NextResponse.json(
        { error: result.error ?? "Meta rejected the event" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, traceId: result.traceId ?? null });
  } catch (error) {
    console.error("orders retry-meta error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
