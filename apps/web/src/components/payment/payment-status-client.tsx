"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";

export type PaymentStatusKind = "completed" | "pending" | "failed" | "unknown";

type StatusData = {
  status?: PaymentStatusKind;
  itemType?: string | null;
  itemId?: string | null;
};

const ICONS: Record<PaymentStatusKind, React.ReactNode> = {
  completed: <CheckCircle2 size={44} style={{ color: "#10B981" }} />,
  pending: <Clock3 size={44} style={{ color: "#F59E0B" }} />,
  failed: <XCircle size={44} style={{ color: "#C0392B" }} />,
  unknown: <Clock3 size={44} style={{ color: "#F59E0B" }} />,
};

const COPY: Record<PaymentStatusKind, { title: string; body: string }> = {
  completed: {
    title: "Payment successful",
    body: "Your purchase is confirmed and everything has been unlocked in your dashboard.",
  },
  pending: {
    title: "Payment processing",
    body: "We've received your payment and are finalising your access. This can take a minute — we'll update automatically as soon as it's confirmed.",
  },
  failed: {
    title: "Payment not completed",
    body: "The payment didn't go through. No charge was made — you can try again anytime.",
  },
  unknown: {
    title: "Checking your payment",
    body: "We couldn't confirm the status yet. Press check again, or sign in to verify your purchase.",
  },
};

export function PaymentStatusClient({
  orderId,
  initialKind,
  itemType,
  itemId,
}: {
  orderId: string;
  initialKind: PaymentStatusKind;
  itemType?: string | null;
  itemId?: string | null;
}) {
  const [kind, setKind] = useState<PaymentStatusKind>(initialKind);
  const [checking, setChecking] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  const finish = useCallback((next: PaymentStatusKind) => {
    if (!mounted.current) return;
    setKind(next);
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const check = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/payments/status?orderId=${encodeURIComponent(orderId)}`,
        { cache: "no-store" }
      );
      const data = (await res.json().catch(() => ({}))) as StatusData;
      if (data?.status === "completed" || data?.status === "failed") {
        finish(data.status);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [orderId, finish]);

  const checkOnce = async () => {
    setChecking(true);
    await check();
    setChecking(false);
  };

  useEffect(() => {
    mounted.current = true;
    if (initialKind === "pending") {
      timer.current = setInterval(() => {
        void check();
      }, 3000);
    }
    return () => {
      mounted.current = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [initialKind, check]);

  const copy = COPY[kind];
  const isSeminar = itemType === "seminar" && !!itemId;
  const ctaHref = isSeminar ? `/seminars/${itemId}` : "/dashboard/courses";
  const ctaLabel = isSeminar ? "Go to seminar" : "Go to my courses";

  return (
    <div
      className="w-full max-w-[480px] rounded-lg border bg-white p-8 sm:p-10 text-center"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex justify-center mb-5">{ICONS[kind]}</div>
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
        {copy.title}
      </h1>
      <p className="text-[14px] mt-2.5 leading-relaxed" style={{ color: "var(--body)" }}>
        {copy.body}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        {kind === "completed" || kind === "pending" ? (
          <Link
            href={ctaHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full text-white text-[14px] font-semibold px-7 py-[12px] transition-all duration-250 hover:-translate-y-[1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void checkOnce()}
            disabled={checking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full text-white text-[14px] font-semibold px-7 py-[12px] transition-all duration-250 hover:-translate-y-[1px] hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--brand)" }}
          >
            {checking ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Check again
          </button>
        )}
        <Link
          href="/dashboard"
          className="text-[13.5px] font-medium px-4 py-[11px]"
          style={{ color: "var(--body)" }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}