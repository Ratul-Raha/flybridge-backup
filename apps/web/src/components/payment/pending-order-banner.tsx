"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShoppingCart, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMoney } from "@/lib/pricing";

type PendingOrder = {
  id: string;
  title: string;
  itemType: string;
  total: number;
  currency: string;
};

/**
 * Reminds a signed-in user about checkouts they started but never paid. Renders
 * nothing unless the account has one or more pending orders; "Complete payment"
 * re-mints a gateway session and redirects the browser to it.
 */
export function PendingOrderBanner() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [resuming, setResuming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/orders/pending", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.orders)) setOrders(d.orders);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || dismissed || orders.length === 0) return null;

  const resume = async (order: PendingOrder) => {
    setResuming(order.id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/resume`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not resume payment");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resume payment");
    } finally {
      setResuming(null);
    }
  };

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: "#F0D9A8",
        background: "linear-gradient(135deg, #FFF6E5 0%, #FFFFFF 65%)",
      }}
    >
      <div className="flex items-start gap-3.5">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "#F7E6C0", color: "#B7791F" }}
        >
          <ShoppingCart size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            You have an incomplete purchase
          </p>

          {orders.map((o) => (
            <div
              key={o.id}
              className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
            >
              <p className="min-w-0 text-[13px]" style={{ color: "var(--body)" }}>
                <span className="font-medium" style={{ color: "var(--ink)" }}>
                  {o.title || "Item"}
                </span>
                {o.total > 0 && <span> · {formatMoney(o.total, o.currency)}</span>}
              </p>
              <button
                type="button"
                onClick={() => resume(o)}
                disabled={resuming === o.id}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--brand)" }}
              >
                {resuming === o.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowRight size={14} />
                )}
                {resuming === o.id ? "Redirecting…" : "Complete payment"}
              </button>
            </div>
          ))}

          {error && (
            <p className="mt-2 text-[12px]" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/5"
          style={{ color: "var(--body)" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
