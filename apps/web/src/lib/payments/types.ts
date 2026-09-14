import "server-only";

import type { OrderDoc, OrderItemType } from "@/lib/models/order";

export type ReconcileResult = {
  status: OrderDoc["status"] | "unknown";
  orderId: string;
  itemType?: OrderItemType | undefined;
  itemId?: string | undefined;
};