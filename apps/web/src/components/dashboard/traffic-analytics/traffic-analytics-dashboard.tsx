"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { BarChart3, Download, Globe, Mail, MousePointerClick, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/dashboard/reports/card";
import { Chart } from "@/components/dashboard/reports/echart";
import { DateRangePicker } from "@/components/dashboard/reports/date-range-picker";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { BRAND, SPLIT_LINE, AXIS_LABEL } from "@/components/dashboard/reports/lib";
import { csvFilename, downloadCsv } from "@/lib/csv";
import {
  dashboardRangeQuery,
  resolveDashboardRange,
  type DashboardRangeSelection,
} from "@/lib/admin/dashboard-range";
import type { AdminEmailClickAnalytics } from "@/lib/admin/email-clicks-types";
import type { AdminResourceClickAnalytics } from "@/lib/admin/resource-clicks-types";
import { sourceLabel, sourceStyle } from "@/components/dashboard/email/source-meta";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "email", label: "Email Traffic" },
  { id: "resources", label: "Resource Traffic" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Mail;
  gradient: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg border bg-white p-5 transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(16,24,40,0.28)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-150"
        style={{ background: gradient }}
      />
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg text-white transition-transform duration-250 group-hover:scale-110 group-hover:rotate-6"
        style={{ background: gradient, boxShadow: `0 8px 18px -6px ${gradient}66` }}
      >
        <Icon size={19} strokeWidth={2.2} />
      </div>
      <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
        {label}
      </p>
      <p className="mt-2.5 text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
        {caption}
      </p>
    </div>
  );
}

function RankingCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { key: string; label: string; sub?: string; value: number; meta?: string }[];
}) {
  return (
    <Card title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <p className="py-12 text-center text-[13.5px]" style={{ color: "var(--body)" }}>
          No data in this period yet.
        </p>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-center gap-3 py-2.5">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold"
                style={{ background: "rgba(110,76,255,0.1)", color: BRAND }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                  {row.label}
                </p>
                {row.sub && (
                  <p className="truncate text-[11.5px]" style={{ color: "var(--body)" }}>
                    {row.sub}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {row.value.toLocaleString()}
                </p>
                {row.meta && (
                  <p className="font-mono text-[10px]" style={{ color: "var(--body)" }}>
                    {row.meta}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TrafficAnalyticsDashboard({
  initialEmailAnalytics,
  initialResourceAnalytics,
}: {
  initialEmailAnalytics: AdminEmailClickAnalytics;
  initialResourceAnalytics: AdminResourceClickAnalytics;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<DashboardRangeSelection>({
    period: initialEmailAnalytics.period,
    from: initialEmailAnalytics.range.from,
    to: initialEmailAnalytics.range.to,
  });
  const [emailAnalytics, setEmailAnalytics] = useState(initialEmailAnalytics);
  const [resourceAnalytics, setResourceAnalytics] = useState(initialResourceAnalytics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (selection: DashboardRangeSelection) => {
      setLoading(true);
      setError(null);
      try {
        const query = dashboardRangeQuery(selection);
        const [emailRes, resourceRes] = await Promise.all([
          fetch(`/api/admin/email-clicks?${query}`, { cache: "no-store" }),
          fetch(`/api/admin/resource-clicks?${query}`, { cache: "no-store" }),
        ]);
        if (!emailRes.ok || !resourceRes.ok) throw new Error("Failed to load traffic analytics");
        const emailJson = (await emailRes.json()) as AdminEmailClickAnalytics;
        const resourceJson = (await resourceRes.json()) as AdminResourceClickAnalytics;
        setEmailAnalytics(emailJson);
        setResourceAnalytics(resourceJson);
      } catch (err: any) {
        setError(err?.message || "Failed to load traffic analytics");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (range.period === initialEmailAnalytics.period && range.from === initialEmailAnalytics.range.from && range.to === initialEmailAnalytics.range.to) {
      return;
    }
    fetchAnalytics(range);
  }, [fetchAnalytics, initialEmailAnalytics.period, initialEmailAnalytics.range.from, initialEmailAnalytics.range.to, range]);

  const rangeLabel = useMemo(() => resolveDashboardRange(range).label, [range]);

  const combinedTrend = useMemo(() => {
    const labels = emailAnalytics.trend.labels.length > resourceAnalytics.trend.labels.length ? emailAnalytics.trend.labels : resourceAnalytics.trend.labels;
    if (labels.length === 0) return { labels: [], values: [] };
    const emailMap = new Map(emailAnalytics.trend.labels.map((l, i) => [l, emailAnalytics.trend.clicks[i] ?? 0]));
    const resourceMap = new Map(resourceAnalytics.trend.labels.map((l, i) => [l, resourceAnalytics.trend.clicks[i] ?? 0]));
    return {
      labels,
      values: labels.map((l) => (emailMap.get(l) ?? 0) + (resourceMap.get(l) ?? 0)),
    };
  }, [emailAnalytics.trend, resourceAnalytics.trend]);

  const trendOption = useMemo<EChartsOption>(() => {
    const labels = tab === "email" ? emailAnalytics.trend.labels : tab === "resources" ? resourceAnalytics.trend.labels : combinedTrend.labels;
    const data = tab === "email" ? emailAnalytics.trend.clicks : tab === "resources" ? resourceAnalytics.trend.clicks : combinedTrend.values;
    return {
      grid: { left: 8, right: 12, top: 12, bottom: 28, containLabel: true },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15,23,42,0.9)",
        borderWidth: 0,
        textStyle: { color: "#fff", fontSize: 12 },
        axisPointer: { type: "line", lineStyle: { color: "rgba(148,163,184,0.4)" } },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color:
        SPLIT_LINE
        },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_LABEL, fontSize: 11 },
      },
      series: [
        {
          type: "line",
          data,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 2.5, color: BRAND },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(110,76,255,0.18)" },
                { offset: 1, color: "rgba(110,76,255,0.01)" },
              ],
            },
          },
          itemStyle: { color: BRAND },
        },
      ],
    };
  }, [combinedTrend, emailAnalytics.trend, resourceAnalytics.trend, tab]);

  const exportCsv = () => {
    const rows: string[][] = [["type", "when", "source", "campaign", "page/resource", "destination/action", "visitor/recipient"]];
    if (tab === "email" || tab === "overview") {
      for (const row of emailAnalytics.recent) {
        rows.push(["email", row.createdAt, row.source, row.campaign, row.destination, row.templateId || "", row.recipient]);
      }
    }
    if (tab === "resources" || tab === "overview") {
      for (const row of resourceAnalytics.recent) {
        rows.push(["resource", row.createdAt, row.source, row.campaign, row.resourceTitle, row.kind, row.visitor]);
      }
    }
    downloadCsv(csvFilename("traffic-analytics"), rows);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Traffic Analytics"
        subtitle="Combined view of email click traffic and resource engagement."
        action={
          <div className="flex items-center gap-2">
            <DateRangePicker value={range} onChange={setRange} />
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1 rounded-full border bg-white p-1" style={{ borderColor: "var(--line)" }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${tab === item.id ? "bg-[var(--brand)] text-white shadow-sm" : "text-[var(--body)] hover:text-[var(--ink)]"}`}
          >
            {item.label}
          </button>
        ))}
        {loading && <span className="ml-2 text-[12px]" style={{ color: "var(--body)" }}>Updating…</span>}
      </div>

      {error && (
        <div className="rounded-lg border px-4 py-3 text-[13px] font-medium" style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)", color: "#BE123C" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Total clicks" value={(emailAnalytics.metrics.clicks + resourceAnalytics.metrics.clicks).toLocaleString()} caption={`Combined traffic · ${rangeLabel}`} icon={MousePointerClick} gradient="linear-gradient(135deg,#6E4CFF,#8B5CF6)" />
        <MetricCard label="Email clicks" value={emailAnalytics.metrics.clicks.toLocaleString()} caption={`${emailAnalytics.metrics.uniqueRecipients.toLocaleString()} unique recipients`} icon={Mail} gradient="linear-gradient(135deg,#10B981,#34D399)" />
        <MetricCard label="Resource clicks" value={resourceAnalytics.metrics.clicks.toLocaleString()} caption={`${resourceAnalytics.metrics.uniqueVisitors.toLocaleString()} unique visitors`} icon={BarChart3} gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)" />
        <MetricCard label="Email sources" value={emailAnalytics.topSources.length.toLocaleString()} caption="Active email channels" icon={Send} gradient="linear-gradient(135deg,#F59E0B,#F97316)" />
        <MetricCard label="Resource sources" value={resourceAnalytics.topSources.length.toLocaleString()} caption="Active resource channels" icon={Globe} gradient="linear-gradient(135deg,#EC4899,#F43F5E)" />
      </div>

      <Card title="Traffic trend" subtitle={`Clicks per day across both channels · ${rangeLabel}`}>
        {(emailAnalytics.trend.labels.length > 0 || resourceAnalytics.trend.labels.length > 0) ? (
          <Chart option={trendOption} height={320} />
        ) : (
          <InlineLoader label="Loading trend…" />
        )}
      </Card>

      {(tab === "overview" || tab === "email") && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <RankingCard title="Top email sources" subtitle="Clicks by traffic channel" rows={emailAnalytics.topSources.slice(0, 8).map((row) => ({ key: row.source, label: sourceLabel(row.source), sub: row.medium, value: row.clicks, meta: `${row.recipients} recipients` }))} />
          <RankingCard title="Top email campaigns" subtitle="Click volume by campaign" rows={emailAnalytics.topCampaigns.slice(0, 8).map((row) => ({ key: row.campaign, label: row.campaign, value: row.clicks, meta: `${row.recipients} recipients` }))} />
          <RankingCard title="Top email templates" subtitle="Templates driving clicks" rows={emailAnalytics.topTemplates.slice(0, 8).map((row) => ({ key: row.templateId, label: row.templateId, value: row.clicks, meta: `${row.recipients} recipients` }))} />
          <RankingCard title="Top email destinations" subtitle="Where clicks go" rows={emailAnalytics.topDestinations.slice(0, 8).map((row) => ({ key: row.destination, label: row.destination, value: row.clicks, meta: `${row.recipients} recipients` }))} />
        </div>
      )}

      {(tab === "overview" || tab === "resources") && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <RankingCard title="Top resource sources" subtitle="Clicks by channel" rows={resourceAnalytics.topSources.slice(0, 8).map((row) => ({ key: row.source, label: sourceLabel(row.source), sub: row.medium, value: row.clicks, meta: `${row.visitors} visitors` }))} />
          <RankingCard title="Top resource campaigns" subtitle="Campaign performance" rows={resourceAnalytics.topCampaigns.slice(0, 8).map((row) => ({ key: row.campaign, label: row.campaign, value: row.clicks, meta: `${row.visitors} visitors` }))} />
          <RankingCard title="Top creatives" subtitle="Ad creative performance" rows={resourceAnalytics.topCreatives.slice(0, 8).map((row) => ({ key: row.creative, label: row.creative, value: row.clicks, meta: `${row.visitors} visitors` }))} />
          <RankingCard title="Top resource pages" subtitle="Most clicked resources" rows={resourceAnalytics.topPages.slice(0, 8).map((row) => ({ key: row.resourceId, label: row.title, sub: row.path, value: row.clicks, meta: `${row.visitors} visitors` }))} />
        </div>
      )}
    </div>
  );
}
