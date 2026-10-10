"use client";

import { useEffect, useState } from "react";
import { Card } from "./card";
import { useCurrency } from "@/components/dashboard/currency-context";
import { InlineLoader } from "@/components/dashboard/page-loader";

type TopItem = {
  title: string;
  itemType: string;
  orders: number;
  revenue: number;
  avgPrice: number;
};

const TYPE_BADGE: Record<string, { bg: string; fg: string }> = {
  course: { bg: "rgba(14,165,233,0.10)", fg: "#0369A1" },
  program: { bg: "rgba(110,76,255,0.10)", fg: "#6E4CFF" },
  subscription: { bg: "rgba(245,158,11,0.10)", fg: "#B45309" },
};

export function TopCourses() {
  const [items, setItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, fmt } = useCurrency();

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setLoading(true);
    fetch(`/api/admin/orders-stats?currency=${currency}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!cancelled) setItems(res?.topItems ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  return (
    <Card title="Top selling items" subtitle="Most purchased items by order count">
      {loading ? (
        <InlineLoader label="Loading…" />
      ) : items.length === 0 ? (
        <p className="text-[13.5px] text-center py-12" style={{ color: "var(--body)" }}>
          No paid orders yet — top items will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                <th className="pb-3 font-medium">Item</th>
                <th className="pb-3 font-medium text-right">Orders</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const badge = TYPE_BADGE[item.itemType] ?? TYPE_BADGE.course;
                return (
                  <tr key={i} className="border-t text-[13.5px]" style={{ borderColor: "var(--line)" }}>
                    <td className="py-3 pr-4">
                      <p className="font-medium truncate max-w-[180px]" style={{ color: "var(--ink)" }}>
                        {item.title}
                      </p>
                      <span
                        className="font-mono text-[9.5px] font-semibold uppercase px-1.5 py-0.5 rounded"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {item.itemType}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold" style={{ color: "var(--ink)" }}>
                      {item.orders}
                    </td>
<td className="py-3 text-right font-medium" style={{ color: "var(--ink)" }}>
  {fmt(item.revenue)}
</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
