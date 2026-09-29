"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Clock, Loader2, RotateCcw, X } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import {
  REFUND_REASONS,
  REFUND_REASON_LABELS,
  REFUND_REASON_MAX_LENGTH,
  REFUND_WINDOW_DAYS,
  resolveRefundReason,
  type RefundReason,
  type RefundStatus,
  type RefundView,
} from "@/lib/refund-policy";
import { BengaliText } from "@/components/bengali-text";
import { EmptyState } from "./ui";

type OrderRow = {
  orderId: string;
  itemTitle: string;
  itemType: string;
  status: string;
  createdAt: string;
  amount: number;
  currency: string;
  slug: string | null;
  refund: RefundView;
};

const ORDER_STATUS: Record<string, { label: string; fg: string; bg: string }> = {
  pending: { label: "Payment pending", fg: "#92400E", bg: "rgba(217,119,6,0.12)" },
  completed: { label: "Completed", fg: "#065F46", bg: "rgba(20,181,126,0.12)" },
  refunded: { label: "Refunded", fg: "#5B21B6", bg: "rgba(139,92,246,0.12)" },
  failed: { label: "Failed", fg: "#991B1B", bg: "rgba(239,68,68,0.12)" },
  cancelled: { label: "Cancelled", fg: "#475569", bg: "rgba(100,116,139,0.12)" },
};

const REFUND_STATUS: Record<RefundStatus, { label: string; fg: string; bg: string }> = {
  refundable: { label: "Refund available", fg: "#065F46", bg: "rgba(20,181,126,0.14)" },
  pending: { label: "Refund requested", fg: "#92400E", bg: "rgba(217,119,6,0.14)" },
  approved: { label: "Refund approved", fg: "#1D4ED8", bg: "rgba(47,95,224,0.12)" },
  refunded: { label: "Refunded", fg: "#5B21B6", bg: "rgba(139,92,246,0.12)" },
  declined: { label: "Refund declined", fg: "#991B1B", bg: "rgba(239,68,68,0.12)" },
  expired: { label: "Window closed", fg: "#475569", bg: "rgba(100,116,139,0.12)" },
  forfeited: { label: "Refund forfeited", fg: "#9A3412", bg: "rgba(249,115,22,0.14)" },
  ineligible: { label: "Not refundable", fg: "#475569", bg: "rgba(100,116,139,0.12)" },
};

function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"
      style={{ color: fg, background: bg }}
    >
      {label}
    </span>
  );
}

function useCountdown(target: string | null) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  return useMemo(() => {
    if (!target || now === null) return null;
    const left = new Date(target).getTime() - now;
    if (left <= 0) return { expired: true, text: "Window closed" };
    const totalMinutes = Math.floor(left / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((left % 60000) / 1000);
    const text =
      days > 0
        ? `${days}d ${hours}h ${minutes}m left`
        : hours > 0
          ? `${hours}h ${minutes}m ${seconds}s left`
          : `${minutes}m ${seconds}s left`;
    return { expired: false, text };
  }, [target, now]);
}

export function MyOrders({ rows }: { rows: OrderRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<OrderRow | null>(null);
  const [reasonCode, setReasonCode] = useState<RefundReason | "">("");
  const [reason, setReason] = useState("");

  const claim = useCallback(
    async (row: OrderRow) => {
      // The same rule the API applies, so an empty claim is caught here
      // instead of coming back as an error.
      const resolved = resolveRefundReason({ reasonCode, reason });
      if (!resolved) {
        setError("Pick a reason, or tell us what happened in a sentence of your own.");
        return;
      }
      setBusy(row.orderId);
      setError(null);
      try {
        const res = await fetch("/api/refunds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: row.orderId, ...resolved }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "We could not submit that refund request.");
          return;
        }
        setConfirming(null);
        setReasonCode("");
        setReason("");
        router.refresh();
      } catch {
        setError("We could not reach the server. Please try again.");
      } finally {
        setBusy(null);
      }
    },
    [reasonCode, reason, router]
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        desc="Anything you buy will show up here, together with its refund status."
        action={
          <Link
            href="/dashboard/courses"
            className="inline-block rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-250 hover:-translate-y-[1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            Browse courses
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl border px-5 py-4 text-[13.5px] leading-[1.7]"
        style={{ borderColor: "var(--line)", background: "var(--bg-soft)", color: "var(--body)" }}
      >
        <span className="font-semibold" style={{ color: "var(--ink)" }}>
          {`${REFUND_WINDOW_DAYS}-day refund guarantee.`}
        </span>{" "}
        Claim a full refund on any course or mock bundle you paid for within{" "}
        {`${REFUND_WINDOW_DAYS} days`} of paying. The claim option disappears once the window
        closes, or as soon as you cross that purchase&apos;s usage allowance — more than 5 lessons
        or more than 1 mock exam on a course, or the first submitted mock on a bundle. Resources
        and seminars are non-refundable.
      </div>

      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-[13px] flex items-start gap-2"
          style={{ borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.06)", color: "#991B1B" }}
        >
          <AlertTriangle className="w-4 h-4 mt-[2px] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {rows.map((row) => (
        <OrderCard
          key={row.orderId}
          row={row}
          busy={busy === row.orderId}
          onRequest={() => {
            setError(null);
            setReasonCode("");
            setReason("");
            setConfirming(row);
          }}
        />
      ))}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(10,20,40,0.55)" }}
          onClick={() => (busy ? null : setConfirming(null))}
        >
          <div
            className="w-full max-w-[440px] rounded-2xl bg-white p-6 flex flex-col gap-4"
            style={{ border: "1px solid var(--line)", boxShadow: "0 30px 70px -30px rgba(18,32,67,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                Request a full refund?
              </h3>
              <button
                onClick={() => setConfirming(null)}
                aria-label="Close"
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--bg-soft)", color: "var(--body)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
              {`We will refund ${formatMoney(confirming.amount, confirming.currency)} for `}
              <span className="font-semibold" style={{ color: "var(--ink)" }}>
                {confirming.itemTitle}
              </span>{" "}
              in full, to your original payment method. Your access to the course ends as soon as the
              refund is processed.
            </p>

            <fieldset className="flex flex-col gap-2">
              <legend
                className="font-mono text-[11px] uppercase tracking-[0.14em] mb-1"
                style={{ color: "var(--body)" }}
              >
                What made you request the refund?
              </legend>
              <div className="flex flex-col gap-1 max-h-[168px] overflow-y-auto pr-1">
                {REFUND_REASONS.map((code) => {
                  const selected = reasonCode === code;
                  return (
                    <label
                      key={code}
                      className="flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors"
                      style={{
                        borderColor: selected ? "var(--brand)" : "var(--line)",
                        background: selected ? "var(--brand-soft)" : "var(--bg-soft)",
                      }}
                    >
                      <input
                        type="radio"
                        name="refund-reason"
                        value={code}
                        checked={selected}
                        onChange={() => setReasonCode(code)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: selected ? "var(--brand)" : "var(--line)" }}
                      >
                        {selected && (
                          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />
                        )}
                      </span>
                      <span className="text-[13px] leading-snug" style={{ color: "var(--ink)" }}>
                        {REFUND_REASON_LABELS[code]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="refund-reason-own-words"
                className="font-mono text-[11px] uppercase tracking-[0.14em]"
                style={{ color: reasonCode ? "var(--body)" : "var(--ink)" }}
              >
                {reasonCode ? "Anything else we should know (optional)" : "Tell us what happened"}
              </label>
              <textarea
                id="refund-reason-own-words"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={REFUND_REASON_MAX_LENGTH}
                required={!reasonCode}
                placeholder="I bought the wrong course…"
                className="w-full rounded-lg border px-3 py-2 text-[13.5px] outline-none resize-none"
                style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--bg-soft)" }}
              />
              <p className="text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                {reasonCode
                  ? "Your reason does not affect your eligibility. Every refund inside the window gets the full amount back."
                  : "None of those fit? Then this box is the reason — a sentence is plenty. It still does not affect your eligibility."}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => claim(confirming)}
                disabled={!!busy}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full text-white text-[14px] font-semibold px-5 py-[11px] disabled:opacity-60"
                style={{ background: "var(--brand)" }}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                {busy ? "Sending…" : "Yes, refund this order"}
              </button>
              <button
                onClick={() => setConfirming(null)}
                disabled={!!busy}
                className="rounded-full px-5 py-[11px] text-[14px] font-semibold border"
                style={{ borderColor: "var(--line)", color: "var(--body)" }}
              >
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  row,
  busy,
  onRequest,
}: {
  row: OrderRow;
  busy: boolean;
  onRequest: () => void;
}) {
  const countdown = useCountdown(row.refund.canClaim ? row.refund.windowEndsAt : null);
  const orderPill = ORDER_STATUS[row.status] ?? {
    label: row.status,
    fg: "#475569",
    bg: "rgba(100,116,139,0.12)",
  };
  const refundPill = REFUND_STATUS[row.refund.status];
  const lessonsLeft = row.refund.lessonsRemaining;
  const mocksLeft = row.refund.mocksRemaining;
  const isBundle = row.refund.itemType === "mock-bundle";

  return (
    <div
      className="rounded-xl border bg-white p-5 flex flex-col gap-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <BengaliText>
              <span className="font-display text-[15.5px] font-semibold" style={{ color: "var(--ink)" }}>
                {row.itemTitle}
              </span>
            </BengaliText>
            <Pill {...orderPill} />
          </div>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--body)" }}>
            {new Date(row.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {row.slug && (
              <>
                {" · "}
                <Link
                  href={`/dashboard/courses/${row.slug}/learn`}
                  className="underline underline-offset-2"
                  style={{ color: "var(--brand)" }}
                >
                  Open course
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
          {formatMoney(row.amount, row.currency)}
        </div>
      </div>

      <div
        className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Pill {...refundPill} />
          {row.refund.canClaim && countdown && !countdown.expired && (
            <span
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium"
              style={{ color: "var(--body)" }}
            >
              <Clock className="w-3.5 h-3.5" />
              {countdown.text}
            </span>
          )}
        </div>

        {row.refund.canClaim ? (
          <button
            onClick={onRequest}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold px-5 py-[9px] disabled:opacity-60 shrink-0"
            style={{ border: "1px solid var(--brand)", color: "var(--brand)" }}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Request refund
          </button>
        ) : (
          <span className="text-[12.5px] sm:text-right max-w-[420px]" style={{ color: "var(--body)" }}>
            {row.refund.message}
          </span>
        )}
      </div>

      {row.refund.status !== "refunded" && row.refund.status !== "ineligible" && (
        <div
          className="flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-[12.5px] leading-[1.6]"
          style={{ background: "var(--bg-soft)", color: "var(--body)" }}
        >
          {row.refund.forfeited ? (
            <AlertTriangle className="w-4 h-4 mt-[1px] shrink-0" style={{ color: "#D97706" }} />
          ) : (
            <Check className="w-4 h-4 mt-[1px] shrink-0" style={{ color: "var(--brand)" }} />
          )}
          <span>
            {row.refund.forfeited ? (
              row.refund.message
            ) : isBundle ? (
              <>
                {`Mocks submitted: ${row.refund.mockTestsPlayed}. `}
                {row.refund.mockTestsPlayed === 0
                  ? "Claim before you submit a mock and the refund stays available."
                  : "Your mock has been used, so the refund has lapsed."}
              </>
            ) : (
              <>
                {`Refund-safe usage: ${row.refund.lessonsPlayed}/${row.refund.lessonLimit} lessons, `}
                {`${row.refund.mockTestsPlayed}/${row.refund.mockLimit} mock exam.`}{" "}
                {lessonsLeft > 0
                  ? `Play ${lessonsLeft} more lesson${lessonsLeft === 1 ? "" : "s"} and the refund stays available.`
                  : "Your next lesson forfeits the refund."}
                {mocksLeft > 0
                  ? ` ${mocksLeft} mock exam left before the refund lapses.`
                  : " Your mock exam allowance is used up."}
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
