"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, DollarSign, Clock, AlertTriangle, Gift } from "lucide-react";
import { Card } from "./card";

type OrderStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  freeOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
};

const CARDS: {
  key: keyof Pick<OrderStats, "totalOrders" | "totalRevenue" | "paidOrders" | "pendingOrders" | "freeOrders">;
  label: string;
  icon: typeof ShoppingCart;
  color: string;
  format: (v: number) => string;
}[] = [
  {
    key: "totalOrders",
    label: "Total orders",
    icon: ShoppingCart,
    color: "#0EA5E9",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "totalRevenue",
    label: "Revenue",
    icon: DollarSign,
    color: "#10B981",
    format: (v) => `BDT ${v.toLocaleString()}`,
  },
  {
    key: "paidOrders",
    label: "Paid",
    icon: Clock,
    color: "#6E4CFF",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "pendingOrders",
    label: "Pending",
    icon: AlertTriangle,
    color: "#F59E0B",
    format: (v) => v.toLocaleString(),
  },
  {
    key: "freeOrders",
    label: "Free enrollments",
    icon: Gift,
    color: "#F43F5E",
    format: (v) => v.toLocaleString(),
  },
];

export function OrderOverview() {
  const [data, setData] = useState<OrderStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders-stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res) setData(res);
      })
      .catch(() => {});
  }, []);

  return (
    <Card title="Order overview" subtitle="Key metrics across all orders">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-1">
        {CARDS.map((c) => (
          <div
            key={c.key}
            className="flex items-center gap-3 rounded-2xl p-3.5"
            style={{ background: "var(--bg-soft)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${c.color}14` }}
            >
              <c.icon size={16} style={{ color: c.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[17px] font-semibold leading-none truncate" style={{ color: "var(--ink)" }}>
                {data ? c.format(data[c.key]) : "\u2014"}
              </p>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] mt-1 truncate" style={{ color: "var(--body)" }}>
                {c.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
