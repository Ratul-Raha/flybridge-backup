import type { Metadata } from "next";
import { resolvePaymentOutcome, type PaymentCallbackParams } from "@/lib/payments/outcome";
import { PaymentStatusClient } from "@/components/payment/payment-status-client";

export const metadata: Metadata = {
  title: "Payment Not Completed | FlyBridge",
};

/**
 * The failUrl callback. Separate from the success page on purpose: EPS routes
 * here when the payment was declined or abandoned, and showing the success
 * screen's "we're confirming your payment" copy and 3s polling would be a lie.
 *
 * It still asks the gateway rather than believing the URL, so a payment that
 * actually went through is reported as completed.
 */
export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: PaymentCallbackParams;
}) {
  const outcome = await resolvePaymentOutcome(searchParams, "failed");

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
