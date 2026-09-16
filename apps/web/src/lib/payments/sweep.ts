import "server-only";

import { connectDb } from "@/lib/db";
import { Order } from "@/lib/models/order";
import { reconcileStripeOrder } from "@/lib/payments/stripe";
import { reconcileEPSOrder } from "@/lib/payments/eps";

const STALE_MS = 15 * 60 * 1000;
const BATCH = 50;

export async function sweepPendingOrders(): Promise<{ checked: number; recovered: number; failed: number }> {
  await connectDb();
  const staleBefore = Date.now() - STALE_MS;
  const viewer = { id: "cron-sweep", isAdmin: true };

  const pending = await Order.find({
    status: "pending",
    createdAt: { $lte: new Date(staleBefore) },
  })
    .sort({ createdAt: 1 })
    .limit(BATCH);

  let recovered = 0;
  let failed = 0;

  for (const order of pending) {
    try {
      const result =
        order.gateway === "eps"
          ? await reconcileEPSOrder(order, viewer)
          : await reconcileStripeOrder(order, viewer);
      if (result.status === "completed") recovered += 1;
    } catch (error) {
      console.error(`sweep order ${order._id} error`, error);
      failed += 1;
    }
  }

  return { checked: pending.length, recovered, failed };
}