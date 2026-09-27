import type { Metadata } from "next";
import { resolvePaymentOutcome, type PaymentCallbackParams } from "@/lib/payments/outcome";
import { PaymentStatusClient } from "@/components/payment/payment-status-client";

export const metadata: Metadata = {
  title: "Payment Status | FlyBridge",
};

/**
 * Where EPS sends the buyer back to. The query string is treated as a hint only
 * — the gateway is re-queried before anything is fulfilled, so landing here
 * does not by itself complete an order.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: PaymentCallbackParams;
}) {
  const outcome = await resolvePaymentOutcome(searchParams, "unknown");

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16">
      <PaymentStatusClient
        orderId={outcome.orderId}
        initialKind={outcome.kind}
        itemType={outcome.itemType}
        itemId={outcome.itemId}
      />
    </div>
  );
}
