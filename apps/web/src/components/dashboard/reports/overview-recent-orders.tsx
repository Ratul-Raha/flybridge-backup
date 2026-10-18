"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import { timeAgo } from "./lib";
import type { OverviewRecentOrder } from "@/lib/admin/overview-analytics-types";

const STATUS_DOT: Record<string, string> = {
  completed: "#10B981",
  pending: "#F59E0B",
  failed: "#EF4444",
  cancelled: "#6B7280",
  refunded: "#8B5CF6",
};

export function OverviewRecentOrders({ orders }: { orders: OverviewRecentOrder[] }) {
  return (
    <div
      className="rounded-lg border bg-white p-[clamp(18px,2.5vw,26px)] flex flex-col"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Recent orders
          </h2>
          <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
            Latest transactions
          </p>
        </div>
        <Link
          href="/dashboard/admin/orders"
          className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0"
          style={{ color: "var(--brand)" }}
        >
          View all
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {orders.length === 0 && (
          <p className="text-[12.5px] py-6 text-center" style={{ color: "var(--body)" }}>
            No orders yet
          </p>
        )}
        {orders.map((order, index) => {
          const dot = STATUS_DOT[order.status] ?? "#6B7280";
          return (
            <Link
              key={order.id}
              href={`/dashboard/admin/orders?order=${order.id}`}
              className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-soft)]"
              style={{ borderBottom: index < orders.length - 1 ? "1px solid var(--line)" : "none" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: `${dot}14`, color: dot }}
              >
                {(order.userName || order.userEmail || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium truncate" style={{ color: "var(--ink)" }}>
                  {order.userName || order.userEmail}
                </p>
                <p className="text-[10.5px] truncate" style={{ color: "var(--body)" }}>
                  {order.itemTitle}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {order.total === 0 ? "Free" : formatMoney(order.total, order.currency)}
                </p>
                <p className="text-[9.5px]" style={{ color: "var(--body)" }}>
                  {timeAgo(order.createdAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
