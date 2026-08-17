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
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Users,
  BarChart3,
  Package,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Chart } from "@/components/dashboard/reports/echart";
import { BRAND, AMBER, SKY, EMERALD, ROSE, AXIS_LABEL, SPLIT_LINE, CARD_TOOLTIP } from "@/components/dashboard/reports/lib";

type OrderItem = { itemType: string; itemId: string; title: string; price: number };

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
  cancelledOrders: number;
  refundedOrders: number;
  freeOrders: number;
  completedOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  thisMonthOrders: number;
  lastMonthOrders: number;
  monthlyGrowth: number;
  topItems: { title: string; itemType: string; orders: number; revenue: number; avgPrice: number }[];
  statusDistribution: { status: string; count: number }[];
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
  chart: { labels: string[]; counts: number[]; revenues: number[] };
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  paid: { bg: "rgba(16,185,129,0.10)", fg: "#047857", dot: "#10B981" },
  pending: { bg: "rgba(245,158,11,0.10)", fg: "#92400E", dot: "#F59E0B" },
  failed: { bg: "rgba(239,68,68,0.10)", fg: "#991B1B", dot: "#EF4444" },
  cancelled: { bg: "rgba(107,114,128,0.10)", fg: "#374151", dot: "#6B7280" },
  refunded: { bg: "rgba(139,92,246,0.10)", fg: "#5B21B6", dot: "#8B5CF6" },
};

const STATUS_OPTIONS = ["all", "paid", "pending", "failed", "cancelled", "refunded"] as const;
const PAGE_SIZE = 10;
type SortKey = "date" | "total" | "status";
type SortDir = "asc" | "desc";

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof ShoppingCart;
  iconBg: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border bg-white px-5 py-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={20} strokeWidth={2} style={{ color: "var(--ink)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="font-display text-[22px] font-bold leading-none tracking-tight" style={{ color: "var(--ink)" }}>
            {value}
          </p>
          {trend && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color: trend.positive ? "#059669" : "#DC2626" }}
            >
              {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {sub && (
          <p className="text-[11px] mt-1" style={{ color: "var(--body)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border bg-white px-5 py-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: "var(--bg-soft)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 rounded" style={{ background: "var(--bg-soft)" }} />
        <div className="h-5 w-20 rounded" style={{ background: "var(--bg-soft)" }} />
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: OrderStats["chart"] }) {
  const option = useMemo<EChartsOption>(() => {
    const revenues = data?.revenues ?? [];
    return {
      grid: { left: 4, right: 4, top: 18, bottom: 0, containLabel: true },
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          return `<b>${p.name}</b><br/>BDT ${p.value.toLocaleString()}`;
        },
      },
      xAxis: {
        type: "category",
        data: data?.labels ?? [],
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: {
          color: AXIS_LABEL,
          fontSize: 10,
          formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
        },
      },
      series: [
        {
          type: "bar",
          data: revenues,
          barWidth: "60%",
          itemStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "#0FA968" },
                { offset: 1, color: "#A7F3D0" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [data]);

  return (
    <div
      className="rounded-2xl border bg-white p-5 flex-1 min-w-0"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Revenue</h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>Last 30 days</p>
        </div>
        <BarChart3 size={16} style={{ color: "var(--body)" }} />
      </div>
      <Chart option={option} height={220} />
    </div>
  );
}

function StatusDonut({ data }: { data: OrderStats["statusDistribution"] }) {
  const option = useMemo<EChartsOption>(() => {
    if (!data || data.length === 0) return {};
    const colorMap: Record<string, string> = {
      paid: "#10B981",
      pending: "#F59E0B",
      failed: "#EF4444",
      cancelled: "#6B7280",
      refunded: "#8B5CF6",
    };
    const total = data.reduce((a, b) => a + b.count, 0);
    return {
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "item",
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `<b>${p.name}</b><br/>${p.value} orders (${p.percent}%)`;
        },
      },
      legend: {
        orient: "vertical",
        right: 8,
        top: "center",
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
        textStyle: { color: "#6A7187", fontSize: 11.5 },
        formatter: (name: string) => {
          const item = data.find((d) => d.status === name);
          return item ? `${name}  ${item.count}` : name;
        },
      },
      graphic: [
        {
          type: "text",
          left: "28%",
          top: "42%",
          style: { text: `${total}`, textAlign: "center", fill: "#122043", fontSize: 22, fontWeight: 700 },
        },
        {
          type: "text",
          left: "28%",
          top: "56%",
          style: { text: "total", textAlign: "center", fill: "#A6ADC0", fontSize: 10.5 },
        },
      ],
      series: [
        {
          type: "pie",
          radius: ["56%", "78%"],
          center: ["30%", "50%"],
          avoidLabelOverlap: false,
          label: { show: false },
          itemStyle: { borderColor: "#fff", borderWidth: 2.5, borderRadius: 6 },
          emphasis: { scale: false },
          data: data.map((d) => ({
            name: d.status,
            value: d.count,
            itemStyle: { color: colorMap[d.status] ?? "#6B7280" },
          })),
        },
      ],
    };
  }, [data]);

  return (
    <div
      className="rounded-2xl border bg-white p-5 w-full lg:w-[380px] shrink-0"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Status</h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>Order breakdown</p>
        </div>
        <Package size={16} style={{ color: "var(--body)" }} />
      </div>
      {data && data.length > 0 ? (
        <Chart option={option} height={200} />
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-[12.5px]" style={{ color: "var(--body)" }}>No data yet</p>
        </div>
      )}
    </div>
  );
}

function TopItems({ items }: { items: OrderStats["topItems"] }) {
  const max = Math.max(...items.map((i) => i.orders), 1);
  return (
    <div
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Top selling</h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>By order volume</p>
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        {items.map((item, i) => (
          <div key={`${item.title}-${i}`} className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: i < 3 ? "var(--brand-soft)" : "var(--bg-soft)",
                color: i < 3 ? "var(--brand)" : "var(--body)",
              }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[12.5px] font-medium truncate" style={{ color: "var(--ink)" }}>
                  {item.title}
                </span>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--ink)" }}>
                  {item.orders}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.orders / max) * 100}%`,
                    background: `linear-gradient(90deg, ${BRAND}, ${EMERALD})`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ orders }: { orders: OrderStats["recentOrders"] }) {
  if (!orders || orders.length === 0) return null;
  return (
    <div
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Recent activity</h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>Latest 5 orders</p>
        </div>
        <Eye size={16} style={{ color: "var(--body)" }} />
      </div>
      <div className="flex flex-col">
        {orders.map((o, i) => {
          const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
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
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: i < orders.length - 1 ? "1px solid var(--line)" : "none" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-bold"
                style={{ background: sc.bg, color: sc.fg }}
              >
                {(o.userName || o.userEmail || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--ink)" }}>
                  {o.userName || o.userEmail}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--body)" }}>
                  {o.items[0]?.title ?? "Order"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {o.total === 0 ? "Free" : `${o.currency} ${o.total.toLocaleString()}`}
                </p>
                <p className="text-[10px]" style={{ color: "var(--body)" }}>{ago}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        subtitle="Track revenue, orders, and customer purchases across the platform."
      />

      {error && (
        <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
          </div>
        </div>
      ) : (
        <>
          {/* ── Metrics Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total revenue"
              value={`${orders[0]?.currency ?? "BDT"} ${(stats?.totalRevenue ?? 0).toLocaleString()}`}
              sub={`${stats?.paidOrders ?? 0} paid orders`}
              icon={DollarSign}
              iconBg="var(--mint-bg)"
            />
            <MetricCard
              label="Total orders"
              value={stats?.totalOrders ?? orders.length}
              sub={`${stats?.freeOrders ?? 0} free enrollments`}
              icon={ShoppingCart}
              iconBg="var(--blue-bg)"
              trend={stats ? { value: stats.monthlyGrowth, positive: stats.monthlyGrowth >= 0 } : undefined}
            />
            <MetricCard
              label="Avg. order value"
              value={`${orders[0]?.currency ?? "BDT"} ${(stats?.avgOrderValue ?? 0).toLocaleString()}`}
              sub="Across all paid orders"
              icon={TrendingUp}
              iconBg="var(--lav-bg)"
            />
            <MetricCard
              label="Pending"
              value={stats?.pendingOrders ?? 0}
              sub={stats?.failedOrders ? `${stats.failedOrders} failed` : undefined}
              icon={Clock}
              iconBg="var(--peach-bg)"
            />
          </div>

          {/* ── Charts Row ── */}
          <div className="flex flex-col lg:flex-row gap-4">
            {stats?.chart && <RevenueChart data={stats.chart} />}
            {stats?.statusDistribution && <StatusDonut data={stats.statusDistribution} />}
          </div>

          {/* ── Top Items + Recent Activity ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            {stats?.topItems && stats.topItems.length > 0 && <TopItems items={stats.topItems} />}
            {stats?.recentOrders && <RecentActivity orders={stats.recentOrders} />}
          </div>

          {/* ── Orders Table ── */}
          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm w-full">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border bg-[var(--bg-soft)] pl-10 pr-4 py-2.5 text-[13px] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/20"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-soft)" }}>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className="text-[11.5px] font-medium capitalize rounded-lg px-3 py-1.5 transition-all"
                      style={
                        statusFilter === s
                          ? { background: "var(--brand)", color: "#fff", boxShadow: "0 1px 3px rgba(15,169,104,0.3)" }
                          : { color: "var(--body)" }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: "var(--bg-soft)" }}>
                    {(["date", "customer", "item", "total", "status", "id"] as const).map((col) => (
                      <th key={col} className="px-5 py-2.5 first:pl-5">
                        {col === "date" || col === "total" || col === "status" ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: sortKey === col ? "var(--ink)" : "var(--body)" }}
                          >
                            {col}
                            {sortKey === col ? (
                              <ChevronDown
                                size={12}
                                className="transition-transform"
                                style={{ transform: sortDir === "asc" ? "rotate(180deg)" : "none" }}
                              />
                            ) : (
                              <ArrowUpDown size={10} className="opacity-30" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--body)" }}>
                            {col}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <Package size={32} className="mx-auto mb-3" style={{ color: "var(--line)" }} />
                        <p className="text-[13.5px] font-medium" style={{ color: "var(--body)" }}>
                          {search || statusFilter !== "all"
                            ? "No orders match your filters"
                            : "No orders yet"}
                        </p>
                        <p className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
                          {search || statusFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Orders will appear here once customers start purchasing"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((o) => {
                      const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                      return (
                        <tr
                          key={o.id}
                          className="group transition-colors hover:bg-[var(--bg-soft)]/50"
                          style={{ borderBottom: "1px solid var(--line)" }}
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                              {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                            <div className="text-[11px]" style={{ color: "var(--body)" }}>
                              {new Date(o.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                                style={{ background: sc.bg, color: sc.fg }}
                              >
                                {(o.userName || o.userEmail || "?")[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-medium truncate max-w-[160px]" style={{ color: "var(--ink)" }}>
                                  {o.userName || "\u2014"}
                                </div>
                                <div className="text-[11px] truncate max-w-[160px]" style={{ color: "var(--body)" }}>
                                  {o.userEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-[12.5px] truncate max-w-[180px]" style={{ color: "var(--ink)" }}>
                              {o.items.map((i) => i.title).join(", ") || "\u2014"}
                            </div>
                            <div className="text-[10.5px] font-medium uppercase tracking-wide" style={{ color: "var(--body)" }}>
                              {o.items[0]?.itemType ?? ""}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--ink)" }}>
                              {o.total === 0 ? (
                                <span className="font-medium" style={{ color: EMERALD }}>Free</span>
                              ) : (
                                `${o.currency} ${o.total.toLocaleString()}`
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1"
                              style={{ background: sc.bg, color: sc.fg }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                              {o.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[10.5px] font-mono" style={{ color: "var(--body)" }}>
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
                <p className="text-[12px]" style={{ color: "var(--body)" }}>
                  Showing {(safePage - 1) * PAGE_SIZE + 1}\u2013{Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                  <span className="font-semibold" style={{ color: "var(--ink)" }}>{filtered.length}</span>
                </p>
                <div className="flex items-center gap-1">
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
                          className="w-8 h-8 rounded-lg text-[12.5px] font-medium transition-all"
                          style={
                            p === safePage
                              ? { background: "var(--brand)", color: "#fff", boxShadow: "0 1px 3px rgba(15,169,104,0.3)" }
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
