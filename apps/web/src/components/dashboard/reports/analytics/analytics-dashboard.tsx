"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import type { EChartsOption } from "echarts";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageLoader } from "@/components/dashboard/page-loader";
import { Card } from "@/components/dashboard/reports/card";
import { Chart } from "@/components/dashboard/reports/echart";
import { AXIS_LABEL, BRAND, CARD_TOOLTIP, SPLIT_LINE } from "@/components/dashboard/reports/lib";
import { formatMoney, MULTI_CURRENCY_CODES, type SupportedCurrency } from "@/lib/pricing";
import { MARKETING_PERIODS, type MarketingPeriod } from "@/lib/marketing-analytics-period";
import type { MarketingAnalyticsData, MarketingTotals } from "@/lib/marketing-analytics-types";

const PERIOD_LABELS: Record<MarketingPeriod, string> = {
  "7d": "7 days",
  "30d": "30 days",
  month: "This month",
  "last-month": "Last month",
};

function percentChange(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "0%" : "New";
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}%`;
}

function formatPeriod(data: MarketingAnalyticsData): string {
  const lastDay = new Date(new Date(data.end).getTime() - 1);
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const from = new Date(data.start).toLocaleDateString("en-US", dateOptions);
  const to = lastDay.toLocaleDateString("en-US", dateOptions);
  return from === to ? from : `${from} – ${to}`;
}

function MetricCard({
  label,
  value,
  current,
  previous,
  inverse = false,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  inverse?: boolean;
}) {
  const improving = inverse ? current <= previous : current >= previous;
  return (
    <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
        {label}
      </p>
      <p className="mt-2 font-display text-[25px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      <p className="mt-2 text-[11.5px] font-semibold" style={{ color: improving ? "#16834B" : "#C0392B" }}>
        {percentChange(current, previous)} vs previous period
      </p>
    </div>
  );
}

function EmptyRows({ message, columns }: { message: string; columns: number }) {
  return (
    <tr>
      <td colSpan={columns} className="py-7 text-center text-[12.5px]" style={{ color: "var(--body)" }}>
        {message}
      </td>
    </tr>
  );
}

function ComparisonMetrics({
  current,
  previous,
  currency,
}: {
  current: MarketingTotals;
  previous: MarketingTotals;
  currency: SupportedCurrency;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      <MetricCard
        label="Gross sales"
        value={formatMoney(current.grossRevenue, currency)}
        current={current.grossRevenue}
        previous={previous.grossRevenue}
      />
      <MetricCard
        label="Net cash"
        value={formatMoney(current.netCash, currency)}
        current={current.netCash}
        previous={previous.netCash}
      />
      <MetricCard
        label="Paid orders"
        value={current.paidOrders.toLocaleString()}
        current={current.paidOrders}
        previous={previous.paidOrders}
      />
      <MetricCard
        label="Zero-value orders"
        value={current.freeOrders.toLocaleString()}
        current={current.freeOrders}
        previous={previous.freeOrders}
      />
      <MetricCard
        label="Average order value"
        value={formatMoney(current.averageOrderValue, currency)}
        current={current.averageOrderValue}
        previous={previous.averageOrderValue}
      />
      <MetricCard
        label="Refunds issued"
        value={formatMoney(current.refunds, currency)}
        current={current.refunds}
        previous={previous.refunds}
        inverse
      />
      <MetricCard
        label="Waitlist leads"
        value={current.leads.toLocaleString()}
        current={current.leads}
        previous={previous.leads}
      />
    </div>
  );
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<MarketingPeriod>("30d");
  const [currency, setCurrency] = useState<SupportedCurrency>("BDT");
  const [data, setData] = useState<MarketingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestNumber = useRef(0);

  const load = useCallback(async (manual = false) => {
    const requestId = ++requestNumber.current;
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/analytics/summary?period=${period}&currency=${currency}`,
        { cache: "no-store" }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Could not load sales analytics");
      if (requestId === requestNumber.current) setData(body as MarketingAnalyticsData);
    } catch (cause) {
      if (requestId === requestNumber.current) {
        setError(cause instanceof Error ? cause.message : "Could not load sales analytics");
      }
    } finally {
      if (requestId === requestNumber.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [currency, period]);

  useEffect(() => {
    void load();
    return () => {
      requestNumber.current += 1;
    };
  }, [load]);

  const chartOption = useMemo<EChartsOption>(() => {
    const points = data?.trend ?? [];
    return {
      grid: { left: 8, right: 8, top: 20, bottom: 4, containLabel: true },
      tooltip: { ...CARD_TOOLTIP, trigger: "axis" },
      legend: {
        top: 0,
        right: 4,
        textStyle: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      xAxis: {
        type: "category",
        data: points.map((point) => point.label),
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      yAxis: [
        {
          type: "value",
          splitLine: { lineStyle: { color: SPLIT_LINE } },
          axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
        },
        {
          type: "value",
          minInterval: 1,
          splitLine: { show: false },
          axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
        },
      ],
      series: [
        {
          name: `Gross sales (${currency})`,
          type: "line",
          smooth: true,
          showSymbol: false,
          data: points.map((point) => point.revenue),
          lineStyle: { color: BRAND, width: 2.5 },
          itemStyle: { color: BRAND },
          areaStyle: { color: "rgba(110,76,255,0.09)" },
        },
        {
          name: "Paid orders",
          type: "bar",
          yAxisIndex: 1,
          data: points.map((point) => point.orders),
          barMaxWidth: 18,
          itemStyle: { color: "rgba(14,165,233,0.5)", borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [currency, data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Growth & Sales"
        subtitle="Paid orders and campaign attribution from FlyBridge records."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-1 rounded-full border bg-white p-1" style={{ borderColor: "var(--line)" }}>
              {MARKETING_PERIODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPeriod(option)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                  style={period === option ? { background: "var(--brand)", color: "#fff" } : { color: "var(--body)" }}
                >
                  {PERIOD_LABELS[option]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-white p-1" style={{ borderColor: "var(--line)" }}>
              {MULTI_CURRENCY_CODES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCurrency(option)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                  style={currency === option ? { background: "var(--brand-soft)", color: "var(--brand)" } : { color: "var(--body)" }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing || loading}
              aria-label="Refresh sales analytics"
              className="flex h-9 w-9 items-center justify-center rounded-full border bg-white disabled:opacity-50"
              style={{ borderColor: "var(--line)", color: "var(--body)" }}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border p-4 text-[13px]" style={{ borderColor: "rgba(244,63,94,0.3)", color: "#BE123C" }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <PageLoader label="Loading sales analytics…" />
      ) : data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]" style={{ color: "var(--body)" }}>
            <span>{formatPeriod(data)} · {data.currency} · Asia/Dhaka time</span>
            <span>Gross sales are completed purchases; net cash subtracts refunds issued in this period.</span>
          </div>

          <ComparisonMetrics current={data.current} previous={data.previous} currency={data.currency} />

          <Card title="Sales trend" subtitle={`${PERIOD_LABELS[data.period]} · gross sales and paid orders`}>
            <Chart option={chartOption} height={300} />
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Marketing sources" subtitle="Gross purchases and waitlist leads by latest non-direct touch">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                      <th className="py-2 pr-3 font-medium">Source / medium</th>
                      <th className="py-2 pr-3 font-medium">Campaign</th>
                      <th className="py-2 pr-3 text-right font-medium">Orders</th>
                      <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                      <th className="py-2 text-right font-medium">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sources.length === 0 ? (
                      <EmptyRows columns={5} message="No attributed orders or leads in this period." />
                    ) : data.sources.map((row, index) => (
                      <tr key={`${row.source}-${row.medium}-${row.campaign}-${index}`} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                        <td className="py-3 pr-3">
                          <span className="block font-semibold" style={{ color: "var(--ink)" }}>{row.source}</span>
                          <span className="text-[10.5px]" style={{ color: "var(--body)" }}>{row.medium}</span>
                        </td>
                        <td className="max-w-[180px] py-3 pr-3" style={{ color: "var(--body)" }}>
                          <span className="block truncate">{row.campaign || "—"}</span>
                          {row.campaignId && <span className="font-mono text-[10px]">ID {row.campaignId}</span>}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{row.orders.toLocaleString()}</td>
                        <td className="py-3 pr-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>{formatMoney(row.revenue, data.currency)}</td>
                        <td className="py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{row.leads.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--body)" }}>
                Older orders without saved campaign data appear as Unattributed. Visits and conversion rates require funnel event counts.
              </p>
            </Card>

            <Card title="Products purchased" subtitle="Gross item revenue before refunds">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                      <th className="py-2 pr-3 font-medium">Product</th>
                      <th className="py-2 pr-3 text-right font-medium">Orders</th>
                      <th className="py-2 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.length === 0 ? (
                      <EmptyRows columns={3} message="No completed orders in this period." />
                    ) : data.products.map((row) => (
                      <tr key={`${row.itemType}-${row.title}`} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                        <td className="py-3 pr-3">
                          <span className="block font-semibold" style={{ color: "var(--ink)" }}>{row.title}</span>
                          <span className="text-[10.5px]" style={{ color: "var(--body)" }}>{row.itemType}</span>
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{row.orders.toLocaleString()}</td>
                        <td className="py-3 text-right tabular-nums font-semibold" style={{ color: "var(--ink)" }}>{formatMoney(row.revenue, data.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Coupon orders" subtitle="Order discounts include stacked course and waitlist savings">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                      <th className="py-2 pr-3 font-medium">Coupon</th>
                      <th className="py-2 pr-3 text-right font-medium">Orders</th>
                      <th className="py-2 text-right font-medium">Total discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coupons.length === 0 ? (
                      <EmptyRows columns={3} message="No coupon orders in this period." />
                    ) : data.coupons.map((row) => (
                      <tr key={row.code} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                        <td className="py-3 pr-3 font-mono font-semibold" style={{ color: "var(--ink)" }}>{row.code}</td>
                        <td className="py-3 pr-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{row.orders.toLocaleString()}</td>
                        <td className="py-3 text-right tabular-nums" style={{ color: "var(--ink)" }}>{formatMoney(row.savings, data.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Meta Purchase delivery" subtitle={`${PERIOD_LABELS[data.period]} · server-side completed-order events`}>
              {!data.meta.configured ? (
                <p className="rounded-lg p-4 text-[12.5px]" style={{ background: "var(--bg-soft)", color: "var(--body)" }}>
                  Meta Conversions API is not configured. Add the Pixel ID and CAPI token to send Purchase events.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Reported", data.meta.reported, "#16834B"],
                    ["Failed", data.meta.failed, "#C0392B"],
                    ["Unreported", data.meta.unreported, "#B7791F"],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-lg border p-4" style={{ borderColor: "var(--line)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>{label}</p>
                      <p className="mt-2 text-[22px] font-semibold" style={{ color: String(color) }}>{Number(value).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--body)" }}>
                Meta ad spend is not connected yet, so ROAS and cost per purchase are intentionally not shown.
              </p>
            </Card>
          </div>

          <div className="flex items-start gap-2 rounded-lg border p-4 text-[12px] leading-relaxed" style={{ borderColor: "#F0D9A8", background: "#FFF9EB", color: "#795D23" }}>
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            This view reports campaign attribution saved with orders and waitlist leads. Meta Ads Manager may report different attributed results because it uses its own attribution window.
          </div>
        </>
      ) : null}
    </div>
  );
}
