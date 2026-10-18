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
  Trash2,
  Eye,
  Radio,
  RefreshCw,
  FileDown,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Chart } from "@/components/dashboard/reports/echart";
import { BRAND, AMBER, SKY, EMERALD, ROSE, AXIS_LABEL, SPLIT_LINE, CARD_TOOLTIP } from "@/components/dashboard/reports/lib";
import { useCurrency } from "@/components/dashboard/currency-context";
import { formatMoney, type SupportedCurrency } from "@/lib/pricing";
import { csvFilename, downloadCsv } from "@/lib/csv";

type OrderItem = { itemType: string; itemId: string; title: string; price: number };

type Order = {
  id: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  currency: string;
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  discountLabel: string | null;
  status: string;
  gateway: string | null;
  gatewayRef: string | null;
  merchantTransactionId: string | null;
  meta: {
    reported: boolean;
    reportedAt: string | null;
    error: string | null;
  } | null;
  createdAt: string;
};

type MetaReporting = {
  pixelId: string | null;
  enabled: boolean;
  reported: number;
  failed: number;
  untracked: number;
};

type OrderStats = {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  freeOrders: number;
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
  completed: { bg: "rgba(16,185,129,0.10)", fg: "#047857", dot: "#10B981" },
  pending: { bg: "rgba(245,158,11,0.10)", fg: "#92400E", dot: "#F59E0B" },
  failed: { bg: "rgba(239,68,68,0.10)", fg: "#991B1B", dot: "#EF4444" },
  cancelled: { bg: "rgba(107,114,128,0.10)", fg: "#374151", dot: "#6B7280" },
  refunded: { bg: "rgba(139,92,246,0.10)", fg: "#5B21B6", dot: "#8B5CF6" },
};

const STATUS_OPTIONS = ["all", "completed", "pending", "failed", "cancelled", "refunded"] as const;
const STATUS_VALUES = ["pending", "completed", "failed", "cancelled", "refunded"] as const;
const GATEWAY_OPTIONS = [
  { value: "", label: "—" },
  { value: "stripe", label: "Stripe" },
  { value: "eps", label: "EPS" },
  { value: "manual", label: "Manual Payment" },
] as const;
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
      className="flex items-center gap-4 rounded-lg border bg-white px-5 py-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
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
      className="flex items-center gap-4 rounded-lg border bg-white px-5 py-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="w-12 h-12 rounded-lg shrink-0" style={{ background: "var(--bg-soft)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 rounded" style={{ background: "var(--bg-soft)" }} />
        <div className="h-5 w-20 rounded" style={{ background: "var(--bg-soft)" }} />
      </div>
    </div>
  );
}

function RevenueChart({ data, currency }: { data: OrderStats["chart"]; currency: SupportedCurrency }) {
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
          return `<b>${p.name}</b><br/>${formatMoney(p.value, currency)}`;
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
  }, [data, currency]);

  return (
    <div
      className="rounded-lg border bg-white p-5 flex-1 min-w-0"
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
      completed: "#10B981",
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
      className="rounded-lg border bg-white p-5 w-full lg:w-[380px] shrink-0"
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
      className="rounded-lg border bg-white p-5"
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

function MetaReportingCard({ data }: { data: MetaReporting }) {
  const total = data.reported + data.failed + data.untracked;
  const tracked = data.reported + data.failed;
  const okRate = tracked === 0 ? 0 : Math.round((data.reported / tracked) * 100);

  const tiles = [
    {
      key: "reported",
      label: "Reported to Meta",
      value: data.reported,
      color: "#10B981",
      bg: "rgba(16,185,129,0.10)",
    },
    {
      key: "failed",
      label: "Rejected",
      value: data.failed,
      color: "#EF4444",
      bg: "rgba(239,68,68,0.10)",
    },
    {
      key: "untracked",
      label: "Not reported",
      value: data.untracked,
      color: "#6B7280",
      bg: "rgba(107,114,128,0.10)",
    },
  ];

  return (
    <div
      className="rounded-lg border bg-white p-5"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            Meta Conversions API
          </h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
            Server-side Purchase delivery for{" "}
            {data.pixelId ? `pixel ${data.pixelId}` : "the configured pixel"}
          </p>
        </div>
        <Radio size={16} style={{ color: "var(--body)" }} />
      </div>

      {!data.enabled ? (
        <div
          className="rounded-lg p-3.5 text-[12px]"
          style={{ background: "rgba(245,158,11,0.08)", color: "#92400E" }}
        >
          Not sending. Add <b>META_CAPI_TOKEN</b> to the environment — purchases are
          completing but Meta has not been told about them.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {tiles.map((t) => (
              <div key={t.key} className="rounded-lg p-3" style={{ background: t.bg }}>
                <p
                  className="text-[20px] font-semibold leading-none"
                  style={{ color: t.color }}
                >
                  {t.value}
                </p>
                <p
                  className="text-[10px] uppercase tracking-[0.1em] mt-1.5"
                  style={{ color: "var(--body)" }}
                >
                  {t.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] mt-3" style={{ color: "var(--body)" }}>
            {tracked === 0
              ? "No paid orders yet to report."
              : `${okRate}% of ${tracked} tracked orders reached Meta.`}
            {data.untracked > 0 &&
              ` ${data.untracked} of ${total} predate tracking or completed while the token was missing — use the retry button on the row to send it now.`}
          </p>
        </>
      )}
    </div>
  );
}

function MetaBadge({ meta, status }: { meta: Order["meta"]; status: string }) {
  if (status !== "completed") return null;
  if (!meta) {
    return (
      <span
        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{ background: "rgba(107,114,128,0.10)", color: "#6B7280" }}
        title="No Conversions API report recorded for this order"
      >
        untracked
      </span>
    );
  }
  if (meta.reported) {
    return (
      <span
        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{ background: "rgba(16,185,129,0.10)", color: "#047857" }}
        title={
          meta.reportedAt
            ? `Reported to Meta at ${new Date(meta.reportedAt).toLocaleString()}`
            : "Reported to Meta"
        }
      >
        reported
      </span>
    );
  }
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: "rgba(239,68,68,0.10)", color: "#991B1B" }}
      title={meta.error ?? "Meta rejected the Purchase event"}
    >
      failed
    </span>
  );
}

function RecentActivity({
  orders,
  onSelect,
}: {
  orders: OrderStats["recentOrders"];
  onSelect?: (id: string) => void;
}) {
  if (!orders || orders.length === 0) return null;
  return (
    <div
      className="rounded-lg border bg-white p-5"
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
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect?.(o.id)}
              className="flex w-full items-center gap-3 py-3 text-left -mx-2 px-2 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-soft)]"
              style={{ borderBottom: i < orders.length - 1 ? "1px solid var(--line)" : "none" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold"
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
                  {o.total === 0 ? "Free" : formatMoney(o.total, o.currency)}
                </p>
                <p className="text-[10px]" style={{ color: "var(--body)" }}>{ago}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OrderManage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [metaReporting, setMetaReporting] = useState<MetaReporting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currency, fmt } = useCurrency();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<"status" | "delete" | null>(null);
  const [bulkStatus, setBulkStatus] = useState("completed");
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);

  const focusOrder = useCallback((id: string) => {
    setSearch("");
    setStatusFilter("all");
    setSortKey("date");
    setSortDir("desc");
    setFocusOrderId(id);
    const params = new URLSearchParams(window.location.search);
    params.set("order", id);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("order");
    if (id) focusOrder(id);
  }, [focusOrder]);

  const load = useCallback(async () => {
    setLoading(true);
    setStats(null);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch(`/api/admin/orders-stats?currency=${currency}`, { cache: "no-store" }),
      ]);
      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.error ?? "Failed to load");
      setOrders(ordersData.orders ?? []);
      setMetaReporting(ordersData.metaReporting ?? null);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => { load(); }, [load]);

  const retryMeta = useCallback(async (order: Order) => {
    setRetryingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/retry-meta`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Meta report failed");
      setError(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Meta report failed");
    } finally {
      setRetryingId(null);
    }
  }, [load]);

  const removeOrder = useCallback(async (order: Order) => {
    if (!confirm(`Delete order #${order.id.slice(-8)}? This also removes associated enrollments and registrations.`)) return;
    setDeletingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }, [load]);

  const patchOrder = useCallback(async (order: Order, body: { status?: string; gateway?: string | null }) => {
    setSavingId(order.id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Update failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }, [load]);

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

  useEffect(() => {
    if (!focusOrderId || orders.length === 0) return;
    const idx = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .findIndex((o) => o.id === focusOrderId);
    if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1);
    const timer = setTimeout(() => {
      document
        .getElementById(`order-${focusOrderId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(timer);
  }, [focusOrderId, orders]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc"); }
  };

  const allOnPage = paged.length > 0 && paged.every((o) => selected.has(o.id));
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPage) {
        paged.forEach((o) => next.delete(o.id));
      } else {
        paged.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const exportCsv = () => {
    const rows = selected.size > 0 ? filtered.filter((o) => selected.has(o.id)) : filtered;
    if (rows.length === 0) return;
    downloadCsv(
      csvFilename("orders"),
      [
        "Order ID",
        "Customer",
        "Email",
        "Items",
        "Item count",
        "Subtotal",
        "Discount",
        "Discount code",
        "Total",
        "Currency",
        "Status",
        "Gateway",
        "Placed",
      ],
      rows.map((o) => [
        o.id,
        o.userName,
        o.userEmail,
        o.items.map((i) => i.title).join("; "),
        o.items.length,
        o.subtotal,
        o.discountAmount,
        o.discountCode ?? "",
        o.total,
        o.currency,
        o.status,
        o.gateway ?? "",
        o.createdAt.slice(0, 10),
      ])
    );
  };

  const bulkSetStatus = async () => {
    if (selected.size === 0) return;
    setBulkBusy("status");
    setError(null);
    try {
      const res = await fetch("/api/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [...selected], action: "status", value: bulkStatus }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Bulk update failed");
      clearSelection();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBulkBusy(null);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected order${selected.size === 1 ? "" : "s"}? This also removes associated enrollments and registrations.`)) return;
    setBulkBusy("delete");
    setError(null);
    try {
      const res = await fetch("/api/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [...selected], action: "delete" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Bulk delete failed");
      clearSelection();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk delete failed");
    } finally {
      setBulkBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        subtitle="Track revenue, orders, and customer purchases across the platform."
      />

      {error && (
        <div className="rounded-lg px-4 py-3 text-[13px]" style={{ background: "#FEF2F2", color: "#991B1B" }}>
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
              value={fmt(stats?.totalRevenue ?? 0)}
              sub={`${stats?.completedOrders ?? 0} completed orders`}
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
              value={fmt(stats?.avgOrderValue ?? 0)}
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
            {stats?.chart && <RevenueChart data={stats.chart} currency={currency} />}
            {stats?.statusDistribution && <StatusDonut data={stats.statusDistribution} />}
          </div>

          {/* ── Top Items + Recent Activity ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            {stats?.topItems && stats.topItems.length > 0 && <TopItems items={stats.topItems} />}
            {stats?.recentOrders && <RecentActivity orders={stats.recentOrders} onSelect={focusOrder} />}
          </div>

          {/* ── Meta Conversions API delivery ── */}
          {metaReporting && <MetaReportingCard data={metaReporting} />}

          {/* ── Orders Table ── */}
          <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm w-full">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border bg-[var(--bg-soft)] pl-10 pr-4 py-2.5 text-[13px] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/20"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-soft)" }}>
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
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={filtered.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-[7px] text-[12px] font-semibold transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-50 disabled:pointer-events-none sm:ml-auto"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <FileDown size={14} />
                  Export
                </button>
              </div>
            </div>

            {selected.size > 0 && (
              <div
                className="flex flex-wrap items-center gap-3 px-5 py-3"
                style={{ borderTop: "1px solid var(--line)", background: "rgba(110,76,255,0.04)" }}
              >
                <span className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {selected.size.toLocaleString()} selected
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    disabled={bulkBusy !== null}
                    className="text-[12px] font-medium rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer disabled:opacity-50"
                    style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#fff" }}
                  >
                    {STATUS_VALUES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={bulkSetStatus}
                    disabled={bulkBusy !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ background: "var(--brand)" }}
                  >
                    {bulkBusy === "status" ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                    Set status
                  </button>
                </div>
                <button
                  type="button"
                  onClick={bulkDelete}
                  disabled={bulkBusy !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.10)", color: "#991B1B" }}
                >
                  {bulkBusy === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Delete
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={bulkBusy !== null}
                  className="text-[12px] font-medium px-2 py-1.5 disabled:opacity-50"
                  style={{ color: "var(--body)" }}
                >
                  Clear
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: "var(--bg-soft)" }}>
                    <th className="px-5 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={allOnPage}
                        onChange={toggleSelectAll}
                        disabled={paged.length === 0}
                        aria-label="Select all orders on this page"
                        className="w-4 h-4 cursor-pointer disabled:opacity-40"
                        style={{ accentColor: "var(--brand)" }}
                      />
                    </th>
                    {(["date", "customer", "item", "total", "status", "payment", "id", "actions"] as const).map((col) => (
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
                      <td colSpan={9} className="px-5 py-16 text-center">
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
                          id={`order-${o.id}`}
                          className="group transition-colors hover:bg-[var(--bg-soft)]/50"
                          style={{
                            borderBottom: "1px solid var(--line)",
                            background:
                              focusOrderId === o.id ? "var(--brand-soft)" : undefined,
                          }}
                        >
                          <td className="px-5 py-3.5 w-10">
                            <input
                              type="checkbox"
                              checked={selected.has(o.id)}
                              onChange={() => toggleSelect(o.id)}
                              aria-label={`Select order #${o.id.slice(-8)}`}
                              className="w-4 h-4 cursor-pointer"
                              style={{ accentColor: "var(--brand)" }}
                            />
                          </td>
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
                                formatMoney(o.total, o.currency)
                              )}
                            </span>
                            {o.discountAmount > 0 && (
                              <div className="text-[10.5px] font-medium" style={{ color: EMERALD }}>
                                {formatMoney(o.subtotal, o.currency)} −{" "}
                                {formatMoney(o.discountAmount, o.currency)}
                                {o.discountCode ? ` (${o.discountCode})` : ""}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <select
                              value={o.status}
                              onChange={(e) => patchOrder(o, { status: e.target.value })}
                              disabled={savingId === o.id}
                              aria-label={`Change status for order #${o.id.slice(-8)}`}
                              className="text-[11px] font-semibold rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer disabled:opacity-50"
                              style={{ background: sc.bg, color: sc.fg }}
                            >
                              {STATUS_VALUES.map((s) => (
                                <option key={s} value={s} style={{ color: "#111" }}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3.5">
                            <select
                              value={o.gateway ?? ""}
                              onChange={(e) => patchOrder(o, { gateway: e.target.value || null })}
                              disabled={savingId === o.id}
                              aria-label={`Change payment method for order #${o.id.slice(-8)}`}
                              className="text-[11px] font-medium rounded-md px-2 py-1 border outline-none cursor-pointer disabled:opacity-50"
                              style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#fff" }}
                            >
                              {GATEWAY_OPTIONS.map((g) => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                              ))}
                            </select>
                            {(o.merchantTransactionId || o.gatewayRef) && (
                              <div className="text-[9.5px] font-mono mt-0.5" style={{ color: "var(--body)" }}>
                                {o.merchantTransactionId ?? o.gatewayRef}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[10.5px] font-mono" style={{ color: "var(--body)" }}>
                              #{o.id.slice(-8)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <MetaBadge meta={o.meta} status={o.status} />
                              {o.status === "completed" && !o.meta?.reported && (
                                <button
                                  type="button"
                                  onClick={() => retryMeta(o)}
                                  disabled={retryingId === o.id}
                                  title="Re-send this Purchase event to Meta"
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors disabled:opacity-30 hover:bg-amber-50"
                                  style={{ color: "var(--body)" }}
                                >
                                  {retryingId === o.id ? (
                                    <Loader2 size={13} className="animate-spin" style={{ color: "var(--brand)" }} />
                                  ) : (
                                    <RefreshCw size={13} />
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeOrder(o)}
                                disabled={deletingId === o.id}
                                title="Delete order"
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors disabled:opacity-30 hover:bg-red-50"
                                style={{ color: "var(--body)" }}
                              >
                                {deletingId === o.id ? (
                                  <Loader2 size={13} className="animate-spin" style={{ color: "#EF4444" }} />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                              </button>
                            </div>
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
