import type { Metadata } from "next";
import { readSession } from "@/lib/auth/session";
import {
  reconcileOrder,
  isStripeConfigured,
} from "@/lib/payments/stripe";
import { PaymentStatusClient, type PaymentStatusKind } from "@/components/payment/payment-status-client";

export const metadata: Metadata = {
  title: "Payment Status | FlyBridge",
};

type ReconcileOutcome = {
  kind: PaymentStatusKind;
  itemType?: string;
  itemId?: string;
};

async function resolveOutcome(
  orderId?: string
): Promise<ReconcileOutcome> {
  if (!orderId || !isStripeConfigured()) return { kind: "unknown" };
  const session = await readSession();
  if (!session?.userId) return { kind: "unknown" };
  try {
    const result = await reconcileOrder(orderId, {
      id: session.userId,
      name: session.name,
      email: session.email,
      isAdmin: session.role === "admin",
    });
    if (result.status === "completed") {
      return { kind: "completed", itemType: result.itemType, itemId: result.itemId };
    }
    if (result.status === "pending")
      return { kind: "pending", itemType: result.itemType, itemId: result.itemId };
    if (result.status === "failed") return { kind: "failed" };
    return { kind: "unknown" };
  } catch (error) {
    console.error("payment success resolve error", error);
    return { kind: "unknown" };
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const outcome = await resolveOutcome(searchParams.order);

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16">
      <PaymentStatusClient
        orderId={searchParams.order ?? ""}
        initialKind={outcome.kind}
        itemType={outcome.itemType}
        itemId={outcome.itemId}
      />
    </div>
  );
}
