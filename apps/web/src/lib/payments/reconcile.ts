import "server-only";

import { connectDb } from "@/lib/db";
import { Order } from "@/lib/models/order";
import type { OrderUser } from "@/lib/orders";
import { reconcileStripeOrder } from "@/lib/payments/stripe";
import { reconcileEPSOrder } from "@/lib/payments/eps";
import type { ReconcileResult } from "@/lib/payments/types";

export type { ReconcileResult };

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

  if (existing.gateway === "eps") {
    return reconcileEPSOrder(existing, viewer);
  }
  return reconcileStripeOrder(existing, viewer);
}