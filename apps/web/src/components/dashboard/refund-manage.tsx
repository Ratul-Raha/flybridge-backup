"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, RotateCcw, X } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import {
  isRefundReason,
  refundReasonLabel,
  NO_REASON_CODE_LABEL,
  REFUND_BUNDLE_MOCK_LIMIT,
  REFUND_LESSON_LIMIT,
  REFUND_MOCK_LIMIT,
} from "@/lib/refund-policy";

type RefundRow = {
  id: string;
  orderId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  gateway: string;
  /** Empty or absent on a claim the student explained in their own words. */
  reasonCode?: string;
  reason: string;
  status: string;
  userName: string;
  userEmail: string;
  lessonsPlayed: number;
  mockTestsPlayed: number;
  /** Absent on claims made before the field existed — those are courses. */
  itemType?: string;
  adminNote: string;
  failureReason: string;
  createdAt: string;
  decidedAt: string | null;
};

const STATUS: Record<string, { label: string; fg: string; bg: string }> = {
  pending: { label: "Pending", fg: "#92400E", bg: "rgba(217,119,6,0.14)" },
  approved: { label: "Awaiting payout", fg: "#1D4ED8", bg: "rgba(47,95,224,0.12)" },
  declined: { label: "Declined", fg: "#991B1B", bg: "rgba(239,68,68,0.12)" },
  refunded: { label: "Refunded", fg: "#5B21B6", bg: "rgba(139,92,246,0.12)" },
  failed: { label: "Gateway failed", fg: "#9A3412", bg: "rgba(249,115,22,0.14)" },
};

const TABS = [
  { key: "pending", label: "Needs review" },
  { key: "approved", label: "Awaiting payout" },
  { key: "failed", label: "Gateway failed" },
  { key: "refunded", label: "Refunded" },
  { key: "declined", label: "Declined" },
  { key: "all", label: "All" },
];

export function RefundManage({ rows }: { rows: RefundRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () => (tab === "all" ? rows : rows.filter((r) => r.status === tab)),
    [rows, tab]
  );

  const run = useCallback(
    async (id: string, action: "approve" | "decline" | "mark_refunded") => {
      setBusy(`${id}:${action}`);
      setError(null);
      try {
        const res = await fetch(`/api/refunds/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note: notes[id] ?? "" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "That action did not go through.");
          return;
        }
        router.refresh();
      } catch {
        setError("We could not reach the server. Please try again.");
      } finally {
        setBusy(null);
      }
    },
    [notes, router]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: rows.length };
    for (const r of rows) map[r.status] = (map[r.status] ?? 0) + 1;
    return map;
  }, [rows]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-full px-3.5 py-[7px] text-[12.5px] font-semibold border"
            style={
              tab === t.key
                ? { background: "var(--ink)", color: "white", borderColor: "var(--ink)" }
                : { borderColor: "var(--line)", color: "var(--body)" }
            }
          >
            {t.label}
            {counts[t.key] ? ` · ${counts[t.key]}` : ""}
          </button>
        ))}
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

      {visible.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-10 text-center text-[13.5px]"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft)", color: "var(--body)" }}
        >
          Nothing here right now.
        </div>
      ) : (
        visible.map((row) => {
          const pill = STATUS[row.status] ?? {
            label: row.status,
            fg: "#475569",
            bg: "rgba(100,116,139,0.12)",
          };
          const isBundle = row.itemType === "mock-bundle";
          // Claims made before the itemType field existed have no type, and
          // they can only ever be courses, so the course limits are the fallback.
          const lessonLimit = isBundle ? 0 : REFUND_LESSON_LIMIT;
          const mockLimit = isBundle ? REFUND_BUNDLE_MOCK_LIMIT : REFUND_MOCK_LIMIT;
          const overLessons = !isBundle && row.lessonsPlayed > lessonLimit;
          const overMocks = row.mockTestsPlayed > mockLimit;
          const withinAllowance = !overLessons && !overMocks;

          return (
            <div
              key={row.id}
              className="rounded-xl border bg-white p-5 flex flex-col gap-3"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                      {row.itemTitle || "Item"}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                      style={{ color: pill.fg, background: pill.bg }}
                    >
                      {pill.label}
                    </span>
                    {row.gateway && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold uppercase"
                        style={{ background: "var(--bg-soft)", color: "var(--body)" }}
                      >
                        {row.gateway}
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] mt-1" style={{ color: "var(--body)" }}>
                    {row.userName || row.userEmail || "Unknown customer"} ·{" "}
                    {new Date(row.createdAt).toLocaleString("en-GB")}
                    {row.decidedAt ? ` · decided ${new Date(row.decidedAt).toLocaleDateString("en-GB")}` : ""}
                  </p>
                  {row.orderId && (
                    <p className="font-mono text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
                      order {row.orderId}
                    </p>
                  )}
                </div>
                <div className="font-mono text-[15px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
                  {formatMoney(row.amount, row.currency)}
                </div>
              </div>

              <div
                className="flex items-center gap-3 flex-wrap rounded-lg px-3.5 py-2.5 text-[12.5px]"
                style={{ background: "var(--bg-soft)", color: "var(--body)" }}
              >
                {isBundle ? (
                  <>
                    <span>Mocks submitted at claim: {row.mockTestsPlayed}</span>
                    <span>Bundle allowance: claim before any mock is submitted</span>
                  </>
                ) : (
                  <>
                    <span>
                      Lessons at claim: {row.lessonsPlayed}/{lessonLimit}
                    </span>
                    <span>
                      Mocks at claim: {row.mockTestsPlayed}/{mockLimit}
                    </span>
                  </>
                )}
                {overLessons && (
                  <span style={{ color: "#9A3412" }}>
                    Forfeited: more than {lessonLimit} lessons played
                  </span>
                )}
                {overMocks && (
                  <span style={{ color: "#9A3412" }}>
                    {isBundle
                      ? "Forfeited: a mock exam was submitted"
                      : `Forfeited: more than ${mockLimit} mock exam played`}
                  </span>
                )}
                {withinAllowance && (
                  <span style={{ color: "#065F46" }}>Within the usage allowance</span>
                )}
              </div>

              {/* A code we no longer offer falls through to the written reason. */}
              {isRefundReason(row.reasonCode) ? (
                <p className="text-[12.5px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                  {refundReasonLabel(row.reasonCode)}
                </p>
              ) : (
                row.reason && (
                  <p className="text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                    {NO_REASON_CODE_LABEL}
                  </p>
                )
              )}
              {row.reason && (
                <p className="text-[13px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                  &ldquo;{row.reason}&rdquo;
                </p>
              )}
              {row.failureReason && (
                <p className="text-[12.5px]" style={{ color: "#9A3412" }}>
                  Gateway said: {row.failureReason}
                </p>
              )}
              {row.adminNote && (
                <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
                  Note: {row.adminNote}
                </p>
              )}

              {(row.status === "pending" || row.status === "approved" || row.status === "failed") && (
                <>
                  <input
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
                    maxLength={1000}
                    placeholder="Internal note (optional)"
                    className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none"
                    style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--bg-soft)" }}
                  />

                  <div className="flex items-center gap-2 flex-wrap">
                    {row.status === "pending" && (
                      <>
                        <ActionButton
                          onClick={() => run(row.id, "approve")}
                          busy={busy === `${row.id}:approve`}
                          icon={<Check className="w-3.5 h-3.5" />}
                          label={row.gateway === "stripe" ? "Approve & refund via Stripe" : "Approve for payout"}
                          primary
                        />
                        <ActionButton
                          onClick={() => run(row.id, "decline")}
                          busy={busy === `${row.id}:decline`}
                          icon={<X className="w-3.5 h-3.5" />}
                          label="Decline"
                        />
                      </>
                    )}
                    {row.status !== "pending" && (
                      <ActionButton
                        onClick={() => run(row.id, "mark_refunded")}
                        busy={busy === `${row.id}:mark_refunded`}
                        icon={<RotateCcw className="w-3.5 h-3.5" />}
                        label="Mark refunded & revoke access"
                        primary
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  busy,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  busy: boolean;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full text-[13px] font-semibold px-4 py-[9px] disabled:opacity-60"
      style={
        primary
          ? { background: "var(--brand)", color: "white" }
          : { border: "1px solid var(--line)", color: "var(--body)" }
      }
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {busy ? "Working…" : label}
    </button>
  );
}
