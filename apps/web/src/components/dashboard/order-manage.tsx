"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

type OrderItem = {
  itemType: string;
  itemId: string;
  title: string;
  price: number;
};

type Order = {
  id: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: string;
  gateway: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  paid: { bg: "var(--brand-soft)", fg: "var(--brand)" },
  pending: { bg: "rgba(245,158,11,0.14)", fg: "#B45309" },
  failed: { bg: "#FDF1F0", fg: "#C0392B" },
  cancelled: { bg: "var(--bg-soft)", fg: "var(--body)" },
  refunded: { bg: "var(--bg-soft)", fg: "var(--body)" },
};

export function OrderManage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setOrders(data.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        subtitle="Every purchase, order and enrollment across the platform."
      />

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
          No orders yet — orders appear here when users enroll in free products or buy paid ones.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const style = STATUS_STYLES[o.status] ?? STATUS_STYLES.pending;
            return (
              <div key={o.id} className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {o.status}
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </span>
                  <span className="ml-auto font-mono text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                    {o.currency} {o.total}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                      {o.userName || o.userEmail}
                    </span>
                    <span className="text-[12.5px]" style={{ color: "var(--body)" }}>
                      {o.items.map((i) => i.title).join(", ") || o.items.map((i) => i.itemId).join(", ")}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    #{o.id.slice(-8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
