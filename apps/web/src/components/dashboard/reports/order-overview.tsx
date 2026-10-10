"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Gift,
  BarChart3,
} from "lucide-react";
import { Card } from "./card";
import { useCurrency } from "@/components/dashboard/currency-context";
import { formatMoney } from "@/lib/pricing";
import { CardLoader } from "@/components/dashboard/page-loader";

type OrderStats = {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  failedOrders: number;
  freeOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  thisMonthOrders: number;
  lastMonthOrders: number;
  monthlyGrowth: number;
  recentOrders: {
    id: string;
    userName: string;
    userEmail: string;
    items: { title: string; price: number; itemType: string }[];
    total: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
};

const STATUS_DOT: Record<string, string> = {
  completed: "#10B981",
  pending: "#F59E0B",
  failed: "#EF4444",
  cancelled: "#6B7280",
  refunded: "#8B5CF6",
};

function Metric({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium truncate" style={{ color: "var(--body)" }}>
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-[16px] font-bold leading-none" style={{ color: "var(--ink)" }}>
            {value}
          </p>
          {trend && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold"
              style={{ color: trend.positive ? "#059669" : "#DC2626" }}
            >
              {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrderOverview() {
  const [data, setData] = useState<OrderStats | null>(null);
  const { currency, fmt } = useCurrency();

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetch(`/api/admin/orders-stats?currency=${currency}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!cancelled && res) setData(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currency]);

  if (!data) return <CardLoader label="Loading…" />;

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Metrics grid */}
      <div
        className="lg:col-span-3 rounded-lg border bg-white p-5"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Order performance
            </h3>
            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
              This month vs last month
            </p>
          </div>
          <BarChart3 size={16} style={{ color: "var(--body)" }} />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Metric
            icon={DollarSign}
            label="Revenue"
            value={data ? fmt(data.totalRevenue) : "\u2014"}
            color="#10B981"
          />
          <Metric
            icon={CheckCircle2}
            label="Completed"
            value={String(data?.completedOrders ?? 0)}
            color="#6E4CFF"
            trend={data ? { value: data.monthlyGrowth, positive: data.monthlyGrowth >= 0 } : undefined}
          />
          <Metric
            icon={Clock}
            label="Pending"
            value={String(data?.pendingOrders ?? 0)}
            color="#F59E0B"
          />
          <Metric
            icon={Gift}
            label="Free enrollments"
            value={String(data?.freeOrders ?? 0)}
            color="#F43F5E"
          />
          <Metric
            icon={TrendingUp}
            label="Avg. order value"
            value={data ? fmt(data.avgOrderValue) : "\u2014"}
            color="#0EA5E9"
          />
          <Metric
            icon={AlertTriangle}
            label="Failed / Cancelled"
            value={String(data?.failedOrders ?? 0)}
            color="#EF4444"
          />
        </div>
      </div>

      {/* Recent orders */}
      <div
        className="lg:col-span-2 rounded-lg border bg-white p-5 flex flex-col"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Recent orders
            </h3>
            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
              Latest 5 transactions
            </p>
          </div>
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          {(!data?.recentOrders || data.recentOrders.length === 0) && (
            <p className="text-[12.5px] py-6 text-center" style={{ color: "var(--body)" }}>
              No orders yet
            </p>
          )}
          {data?.recentOrders.map((o, i) => {
            const dot = STATUS_DOT[o.status] ?? "#6B7280";
            const timeDiff = Date.now() - new Date(o.createdAt).getTime();
            const mins = Math.floor(timeDiff / 60000);
            const hours = Math.floor(mins / 60);
            const days = Math.floor(hours / 24);
            let ago = "just now";
            if (days > 0) ago = `${days}d ago`;
            else if (hours > 0) ago = `${hours}h ago`;
            else if (mins > 0) ago = `${mins}m ago`;

            return (
              <div
                key={o.id}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: i < (data?.recentOrders.length ?? 0) - 1 ? "1px solid var(--line)" : "none" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: `${dot}14`, color: dot }}
                >
                  {(o.userName || o.userEmail || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium truncate" style={{ color: "var(--ink)" }}>
                    {o.userName || o.userEmail}
                  </p>
                  <p className="text-[10.5px] truncate" style={{ color: "var(--body)" }}>
                    {o.items[0]?.title ?? "Order"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11.5px] font-semibold" style={{ color: "var(--ink)" }}>
                    {o.total === 0 ? "Free" : formatMoney(o.total, o.currency)}
                  </p>
                  <p className="text-[9.5px]" style={{ color: "var(--body)" }}>{ago}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
