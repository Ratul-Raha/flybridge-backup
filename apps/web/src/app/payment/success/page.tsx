import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { readSession } from "@/lib/auth/session";
import {
  reconcileOrder,
  isStripeConfigured,
} from "@/lib/payments/stripe";

export const metadata: Metadata = {
  title: "Payment Status | FlyBridge",
};

type ReconcileOutcome = {
  kind: "completed" | "pending" | "failed" | "unknown";
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
      return { kind: "completed", itemId: result.itemId };
    }
    if (result.status === "pending") return { kind: "pending", itemId: result.itemId };
    if (result.status === "failed") return { kind: "failed" };
    return { kind: "unknown" };
  } catch (error) {
    console.error("payment success resolve error", error);
    return { kind: "unknown" };
  }
}

const ICONS = {
  completed: <CheckCircle2 size={44} style={{ color: "#10B981" }} />,
  pending: <Clock3 size={44} style={{ color: "#F59E0B" }} />,
  failed: <XCircle size={44} style={{ color: "#C0392B" }} />,
  unknown: <Clock3 size={44} style={{ color: "#F59E0B" }} />,
} as const;

const COPY = {
  completed: {
    title: "Payment successful",
    body: "Your purchase is confirmed and everything has been unlocked in your dashboard.",
  },
  pending: {
    title: "Payment processing",
    body: "We've received your payment confirmation and are finalising your access. Refresh in a moment.",
  },
  failed: {
    title: "Payment not completed",
    body: "The payment didn't go through. No charge was made — you can try again anytime.",
  },
  unknown: {
    title: "Checking your payment",
    body: "Sign in to verify the status of your purchase.",
  },
} as const;

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const outcome = await resolveOutcome(searchParams.order);
  const copy = COPY[outcome.kind];

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16">
      <div
        className="w-full max-w-[480px] rounded-[24px] border bg-white p-8 sm:p-10 text-center"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex justify-center mb-5">{ICONS[outcome.kind]}</div>
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
          {copy.title}
        </h1>
        <p className="text-[14px] mt-2.5 leading-relaxed" style={{ color: "var(--body)" }}>
          {copy.body}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          {outcome.kind === "completed" || outcome.kind === "pending" ? (
            <Link
              href="/dashboard/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full text-white text-[14px] font-semibold px-7 py-[12px] transition-all duration-250 hover:-translate-y-[1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              Go to my courses
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className="text-[13.5px] font-medium px-4 py-[11px]"
            style={{ color: "var(--body)" }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
