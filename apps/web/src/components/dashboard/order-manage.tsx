"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  DollarSign,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Gift,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/dashboard/reports/card";
import { Chart } from "@/components/dashboard/reports/echart";
import { BRAND, AXIS_LABEL, SPLIT_LINE, CARD_TOOLTIP } from "@/components/dashboard/reports/lib";

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

type OrderStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  freeOrders: number;
  completedOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  topItems: { title: string; itemType: string; orders: number; revenue: number; avgPrice: number }[];
  chart: { labels: string[]; counts: number[]; revenues: number[] };
};

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  paid: { bg: "rgba(16,185,129,0.12)", fg: "#047857" },
  pending: { bg: "rgba(245,158,11,0.12)", fg: "#B45309" },
  failed: { bg: "rgba(239,68,68,0.12)", fg: "#C0392B" },
  cancelled: { bg: "var(--bg-soft)", fg: "var(--body)" },
  refunded: { bg: "rgba(139,92,246,0.12)", fg: "#6D28D9" },
};

const STATUS_OPTIONS = ["all", "paid", "pending", "failed", "cancelled", "refunded"] as const;
const PAGE_SIZE = 12;
type SortKey = "date" | "total" | "status";
type SortDir = "asc" | "desc";

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: typeof ShoppingCart;
  gradient: string;
}) {
  return (
    <div
      className="relative rounded-[22px] border bg-white p-5 overflow-hidden"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: gradient }} />
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-3"
        style={{ background: gradient }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <p className="font-display text-[22px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-1.5" style={{ color: "var(--body)" }}>
        {label}
      </p>
    </div>
  );
}

function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-[22px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
          <div className="w-10 h-10 rounded-2xl mb-3" style={{ background: "var(--line)" }} />
          <div className="h-[22px] w-16 rounded-lg mb-1.5" style={{ background: "var(--line)" }} />
          <div className="h-[10px] w-24 rounded" style={{ background: "var(--line)" }} />
        </div>
      ))}
    </div>
  );
}

function OrdersChart({ data }: { data: OrderStats["chart"] }) {
  const option = useMemo<EChartsOption>(() => {
    const counts = data?.counts ?? [];
    const total = counts.reduce((a, b) => a + b, 0);
    return {
      grid: { left: 4, right: 4, top: 26, bottom: 0, containLabel: true },
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          return `<b>${p.name}</b><br/>${p.value} ${p.value === 1 ? "order" : "orders"}`;
        },
      },
      xAxis: {
        type: "category",
        data: data?.labels ?? [],
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      series: [
        {
          name: "Orders",
          type: "line",
          smooth: true,
          data: counts,
          symbol: "circle",
          symbolSize: 7,
          showSymbol: false,
          lineStyle: { color: BRAND, width: 2.5 },
          itemStyle: { color: BRAND },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(15,169,104,0.28)" },
                { offset: 1, color: "rgba(15,169,104,0.02)" },
              ],
            },
          },
          markPoint:
            total > 0
              ? {
                  data: [
                    {
                      name: "peak",
                      type: "max",
                      label: { formatter: "{c}", color: "#fff", fontSize: 10.5, fontWeight: 600 },
                      itemStyle: { color: BRAND },
                      symbolSize: 38,
                    },
                  ],
                }
              : undefined,
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="Orders over time"
      subtitle="Daily order count for the last 30 days"
      action={
        data ? (
          <span
            className="font-mono text-[11px] font-semibold rounded-full px-3 py-1 shrink-0"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            sum {data.counts.reduce((a, b) => a + b, 0).toLocaleString()}
          </span>
        ) : null
      }
    >
      <Chart option={option} height={280} />
    </Card>
  );
}

export function OrderManage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/admin/orders-stats", { cache: "no-store" }),
      ]);
      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.error ?? "Failed to load");
      setOrders(ordersData.orders ?? []);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = orders;
    if (q) {
      list = list.filter(
        (o) =>
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.items.some((i) => i.title.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortKey === "total") cmp = a.total - b.total;
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [orders, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc"); }
  };

  const fmtCurrency = (n: number, c: string) => `${c} ${n.toLocaleString()}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        subtitle="Every purchase, order and enrollment across the platform."
      />

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>{error}</p>
      )}

      {loading ? (
        <>
          <SkeletonStatCards />
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total orders"
              value={stats?.totalOrders ?? orders.length}
              icon={ShoppingCart}
              gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)"
            />
            <StatCard
              label="Total revenue"
              value={stats ? `${orders[0]?.currency ?? "BDT"} ${stats.totalRevenue.toLocaleString()}` : "\u2014"}
              icon={DollarSign}
              gradient="linear-gradient(135deg,#10B981,#34D399)"
            />
            <StatCard
              label="Pending"
              value={stats?.pendingOrders ?? 0}
              icon={AlertTriangle}
              gradient="linear-gradient(135deg,#F59E0B,#F97316)"
            />
            <StatCard
              label="Failed / Cancelled"
              value={stats?.failedOrders ?? 0}
              icon={AlertTriangle}
              gradient="linear-gradient(135deg,#EF4444,#F87171)"
            />
          </div>

          {/* Completed Orders — compound card */}
          <div
            className="relative rounded-[22px] border bg-white p-5 overflow-hidden"
            style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: "linear-gradient(135deg,#6E4CFF,#8B5CF6)" }} />
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg,#6E4CFF,#8B5CF6)" }}
              >
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-display text-[22px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                  {stats?.completedOrders ?? 0}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-1" style={{ color: "var(--body)" }}>
                  Completed orders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 pl-[52px]">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#047857" }}
                >
                  Paid
                </span>
                <span className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  {stats?.paidOrders ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                  style={{ background: "rgba(244,63,94,0.12)", color: "#E11D48" }}
                >
                  Free
                </span>
                <span className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  {stats?.freeOrders ?? 0}
                </span>
              </div>
            </div>
          </div>

          {stats?.chart && <OrdersChart data={stats.chart} />}

          {/* Top Selling Items */}
          {stats?.topItems && stats.topItems.length > 0 && (
            <div
              className="rounded-[22px] border bg-white p-[clamp(18px,2.5vw,26px)]"
              style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                    Top selling items
                  </h2>
                  <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
                    Best performing products by order count
                  </p>
                </div>
                <TrendingUp size={16} style={{ color: "var(--body)" }} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--line)" }}>
                      <th className="pb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--body)" }}>
                        #
                      </th>
                      <th className="pb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--body)" }}>
                        Item
                      </th>
                      <th className="pb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--body)" }}>
                        Type
                      </th>
                      <th className="pb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold text-right" style={{ color: "var(--body)" }}>
                        Orders
                      </th>
                      <th className="pb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold text-right" style={{ color: "var(--body)" }}>
                        Revenue
                      </th>
                      <th className="pb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold text-right" style={{ color: "var(--body)" }}>
                        Avg price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topItems.map((item, i) => (
                      <tr key={`${item.title}-${i}`} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td className="py-3 pr-4">
                          <span
                            className="font-mono text-[10px] font-semibold w-5 h-5 rounded-full inline-flex items-center justify-center"
                            style={{
                              background: i < 3 ? "var(--brand-soft)" : "var(--bg-soft)",
                              color: i < 3 ? "var(--brand)" : "var(--body)",
                            }}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-[13px] font-medium truncate max-w-[240px] block" style={{ color: "var(--ink)" }}>
                            {item.title}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full px-2.5 py-[3px]"
                            style={
                              item.itemType === "course"
                                ? { background: "rgba(16,185,129,0.12)", color: "#047857" }
                                : item.itemType === "seminar"
                                ? { background: "rgba(14,165,233,0.12)", color: "#0369A1" }
                                : { background: "rgba(139,92,246,0.12)", color: "#6D28D9" }
                            }
                          >
                            {item.itemType}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                            {item.orders}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                            BDT {item.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-[12.5px]" style={{ color: "var(--body)" }}>
                            BDT {item.avgPrice.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
              <input
                type="text"
                placeholder="Search by name, email, order ID or item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-[13.5px] outline-none transition-colors focus:border-[var(--brand)]"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] rounded-full px-3.5 py-[7px] transition-colors"
                  style={
                    statusFilter === s
                      ? { background: "var(--brand)", color: "#fff" }
                      : { background: "var(--bg-soft)", color: "var(--body)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-[20px] border bg-white overflow-hidden"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <th className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("date")}
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold"
                        style={{ color: sortKey === "date" ? "var(--ink)" : "var(--body)" }}
                      >
                        Date
                        {sortKey === "date" ? (
                          <ChevronDown
                            size={12}
                            className="transition-transform"
                            style={{ transform: sortDir === "asc" ? "rotate(180deg)" : "none" }}
                          />
                        ) : (
                          <ArrowUpDown size={11} className="opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-3.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--body)" }}>
                        Customer
                      </span>
                    </th>
                    <th className="px-5 py-3.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--body)" }}>
                        Item
                      </span>
                    </th>
                    <th className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("total")}
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold"
                        style={{ color: sortKey === "total" ? "var(--ink)" : "var(--body)" }}
                      >
                        Total
                        {sortKey === "total" ? (
                          <ChevronDown
                            size={12}
                            className="transition-transform"
                            style={{ transform: sortDir === "asc" ? "rotate(180deg)" : "none" }}
                          />
                        ) : (
                          <ArrowUpDown size={11} className="opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] font-semibold"
                        style={{ color: sortKey === "status" ? "var(--ink)" : "var(--body)" }}
                      >
                        Status
                        {sortKey === "status" ? (
                          <ChevronDown
                            size={12}
                            className="transition-transform"
                            style={{ transform: sortDir === "asc" ? "rotate(180deg)" : "none" }}
                          />
                        ) : (
                          <ArrowUpDown size={11} className="opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-5 py-3.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--body)" }}>
                        ID
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-14 text-center">
                        <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
                          {search || statusFilter !== "all"
                            ? "No orders match your search."
                            : "No orders yet — orders appear here when users enroll or buy products."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((o) => {
                      const style = STATUS_STYLES[o.status] ?? STATUS_STYLES.pending;
                      return (
                        <tr
                          key={o.id}
                          className="transition-colors hover:bg-[var(--bg-soft)]"
                          style={{ borderBottom: "1px solid var(--line)" }}
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-[12.5px]" style={{ color: "var(--ink)" }}>
                              {new Date(o.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <br />
                            <span className="text-[11px]" style={{ color: "var(--body)" }}>
                              {new Date(o.createdAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[13px] font-medium truncate max-w-[180px]" style={{ color: "var(--ink)" }}>
                              {o.userName || "\u2014"}
                            </p>
                            <p className="text-[11.5px] truncate max-w-[180px]" style={{ color: "var(--body)" }}>
                              {o.userEmail}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-[12.5px] truncate max-w-[200px]" style={{ color: "var(--ink)" }}>
                              {o.items.map((i) => i.title).join(", ") || "\u2014"}
                            </p>
                            <p className="text-[11px] font-mono" style={{ color: "var(--body)" }}>
                              {o.items[0]?.itemType ?? "\u2014"}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                              {fmtCurrency(o.total, o.currency)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="inline-block font-mono text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]"
                              style={{ background: style.bg, color: style.fg }}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                              #{o.id.slice(-8)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > PAGE_SIZE && (
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
                  Showing {(safePage - 1) * PAGE_SIZE + 1}\u2013{Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bg-soft)]"
                    style={{ color: "var(--ink)" }}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-[12px]" style={{ color: "var(--body)" }}>
                          \u2026
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p as number)}
                          className="w-8 h-8 rounded-lg text-[12.5px] font-medium transition-colors"
                          style={
                            p === safePage
                              ? { background: "var(--brand)", color: "#fff" }
                              : { color: "var(--ink)" }
                          }
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bg-soft)]"
                    style={{ color: "var(--ink)" }}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
