import "server-only";

import { readSession } from "@/lib/auth/session";
import { findOrderIdByMerchantTransactionId, reconcileOrder } from "@/lib/payments/reconcile";
import type { PaymentStatusKind } from "@/components/payment/payment-status-client";

/** What EPS hands back on the success/fail/cancel redirect. */
export type PaymentCallbackParams = {
  order?: string;
  /** EPS's own reference for the transaction, appended to the return URL. */
  merchantTransactionId?: string;
};

export type PaymentOutcome = {
  kind: PaymentStatusKind;
  orderId: string;
  itemType?: string;
  itemId?: string;
};

/**
 * Work out which order a callback refers to, then ask the gateway what really
 * happened to it.
 *
 * The query string is a hint, never evidence: the gateway is re-queried on
 * every callback, so a buyer editing the URL cannot complete an order, and a
 * stale or hand-edited status changes nothing. Falls back to `fallback` when
 * there is no session, no order, or the gateway cannot be reached.
 */
export async function resolvePaymentOutcome(
  params: PaymentCallbackParams,
  fallback: PaymentStatusKind
): Promise<PaymentOutcome> {
  const orderId =
    params.order ??
    (params.merchantTransactionId
      ? await findOrderIdByMerchantTransactionId(params.merchantTransactionId)
      : null);

  if (!orderId) return { kind: fallback, orderId: "" };

  const session = await readSession();
  if (!session?.userId) return { kind: fallback, orderId };

  try {
    const result = await reconcileOrder(orderId, {
      id: session.userId,
      name: session.name,
      email: session.email,
      isAdmin: session.role === "admin",
    });
    const kind: PaymentStatusKind =
      result.status === "completed"
        ? "completed"
        : result.status === "pending"
          ? "pending"
          : result.status === "failed"
            ? "failed"
            : fallback;
    return {
      kind,
      orderId,
      itemType: result.itemType,
      itemId: result.itemId,
    };
  } catch (error) {
    console.error("payment callback resolve error", error);
    return { kind: fallback, orderId };
  }
}
