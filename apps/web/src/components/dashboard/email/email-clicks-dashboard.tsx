"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { Download, Mail, MousePointerClick, Send, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/dashboard/reports/card";
import { Chart } from "@/components/dashboard/reports/echart";
import { DateRangePicker } from "@/components/dashboard/reports/date-range-picker";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { BRAND, EMERALD, SPLIT_LINE, AXIS_LABEL, timeAgo } from "@/components/dashboard/reports/lib";
import { csvFilename, downloadCsv } from "@/lib/csv";
import {
  dashboardRangeQuery,
  resolveDashboardRange,
  type DashboardRangeSelection,
} from "@/lib/admin/dashboard-range";
import type {
  AdminEmailClickAnalytics,
  EmailClickCampaign,
  EmailClickDestination,
  EmailClickSource,
  EmailClickTemplate,
} from "@/lib/admin/email-clicks-types";
import { sourceLabel, sourceStyle } from "@/components/dashboard/email/source-meta";

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
      className="group relative rounded-lg border bg-white p-5 overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(16,24,40,0.28)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-150"
        style={{ background: gradient }}
      />
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4 transition-transform duration-250 group-hover:scale-110 group-hover:rotate-6"
        style={{ background: gradient, boxShadow: `0 8px 18px -6px ${gradient}66` }}
      >
        <Icon size={19} strokeWidth={2.2} />
      </div>
      <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
        {label}
      </p>
      <p className="text-[11.5px] mt-2.5 font-medium" style={{ color: "var(--body)" }}>
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
  rows: { key: string; label: string; sub?: string; clicks: number; recipients: number }[];
}) {
  return (
    <Card title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <p className="text-[13.5px] text-center py-12" style={{ color: "var(--body)" }}>
          No tracked clicks in this period yet.
        </p>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-center gap-3 py-2.5">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold shrink-0"
                style={{ background: "rgba(110,76,255,0.1)", color: BRAND }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                  {row.label}
                </p>
                {row.sub && (
                  <p className="truncate text-[11.5px]" style={{ color: "var(--body)" }}>
                    {row.sub}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {row.clicks.toLocaleString()}
                </p>
                <p className="font-mono text-[10px]" style={{ color: "var(--body)" }}>
                  {row.recipients} {row.recipients === 1 ? "person" : "people"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function campaignRows(rows: EmailClickCampaign[]) {
  return rows.map((row) => ({
    key: row.campaign,
    label: row.campaign,
    clicks: row.clicks,
    recipients: row.recipients,
  }));
}

function sourceRows(rows: EmailClickSource[]) {
  return rows.map((row) => ({
    key: `${row.source}/${row.medium}`,
    label: sourceLabel(row.source),
    sub: row.medium,
    clicks: row.clicks,
    recipients: row.recipients,
  }));
}

function templateRows(rows: EmailClickTemplate[]) {
  return rows.map((row) => ({
    key: row.templateId,
    label: row.templateId,
    clicks: row.clicks,
    recipients: row.recipients,
  }));
}

function destinationRows(rows: EmailClickDestination[]) {
  return rows.map((row) => ({
    key: row.destination,
    label: row.destination,
    clicks: row.clicks,
    recipients: row.recipients,
  }));
}

export function EmailClicksDashboard({
  initialAnalytics,
}: {
  initialAnalytics: AdminEmailClickAnalytics;
}) {
  const [selection, setSelection] = useState<DashboardRangeSelection>({ period: "30d" });
  const [analytics, setAnalytics] = useState<AdminEmailClickAnalytics>(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDefault = selection.period === "30d";

  useEffect(() => {
    if (isDefault) {
      setAnalytics(initialAnalytics);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/email-clicks?${dashboardRangeQuery(selection)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error ?? "Failed to load email clicks");
        return body as AdminEmailClickAnalytics;
      })
      .then((res) => {
        if (!cancelled) setAnalytics(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load email clicks");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selection, isDefault, initialAnalytics]);

  let range = null;
  try {
    range = resolveDashboardRange(selection);
  } catch {
    range = null;
  }

  const option = useMemo<EChartsOption>(() => {
    return {
      grid: { left: 8, right: 8, top: 24, bottom: 0, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const points = (Array.isArray(params) ? params : [params]) as { name: string; value: number }[];
          const day = points[0]?.name ?? "";
          return `<b>${day}</b><br/>Clicks: ${Number(points[0]?.value ?? 0).toLocaleString()}`;
        },
      },
      xAxis: {
        type: "category",
        data: analytics.trend.labels,
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_LABEL, fontSize: 10 },
      },
      series: [
        {
          name: "Clicks",
          type: "bar",
          data: analytics.trend.clicks,
          barMaxWidth: 14,
          itemStyle: { color: BRAND, borderRadius: [3, 3, 0, 0] },
        },
      ],
    };
  }, [analytics]);

  const exportCsv = () => {
    downloadCsv(
      csvFilename("traffic-sources"),
      ["Date", "Source", "Medium", "Recipient", "Campaign", "Template", "Destination", "Referrer"],
      analytics.recent.map((row) => [
        row.createdAt,
        row.source,
        row.medium,
        row.recipient,
        row.campaign,
        row.templateId,
        row.destination,
        row.referrer,
      ]),
    );
  };

  const metrics = analytics.metrics;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Traffic Sources"
        subtitle="Which channels and links drive clicks — grouped by source, campaign, template and destination."
        action={
          <div className="flex items-center gap-3">
            {loading && <InlineLoader label="Updating…" />}
            <DateRangePicker value={selection} range={range} onChange={setSelection} />
          </div>
        }
      />

      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-[13px] font-medium"
          style={{
            borderColor: "rgba(244,63,94,0.3)",
            background: "rgba(244,63,94,0.06)",
            color: "#BE123C",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Tracked clicks"
          value={metrics.clicks.toLocaleString()}
          caption={`All tracked link clicks · ${analytics.range.label}`}
          icon={MousePointerClick}
          gradient="linear-gradient(135deg,#6E4CFF,#8B5CF6)"
        />
        <MetricCard
          label="Unique visitors"
          value={metrics.uniqueRecipients.toLocaleString()}
          caption="Distinct people who clicked"
          icon={Users}
          gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)"
        />
        <MetricCard
          label="Sources"
          value={analytics.topSources.length.toLocaleString()}
          caption="Traffic channels with clicks"
          icon={Send}
          gradient="linear-gradient(135deg,#10B981,#34D399)"
        />
        <MetricCard
          label="Clicks / recipient"
          value={metrics.clicksPerRecipient.toLocaleString()}
          caption={`${metrics.uniqueDestinations} distinct destinations`}
          icon={Target}
          gradient="linear-gradient(135deg,#F59E0B,#F97316)"
        />
      </div>

      <Card title="Click trend" subtitle={`Tracked clicks per day by source · ${analytics.range.label}`}>
        {analytics.trend.labels.length > 0 ? (
          <Chart option={option} height={300} />
        ) : (
          <InlineLoader label="Loading trend…" />
        )}
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        <RankingCard title="Top sources" subtitle="Clicks by traffic channel" rows={sourceRows(analytics.topSources)} />
        <RankingCard title="Top campaigns" subtitle="Click volume by campaign" rows={campaignRows(analytics.topCampaigns)} />
        <RankingCard title="Top templates" subtitle="Automation templates that drive clicks" rows={templateRows(analytics.topTemplates)} />
        <RankingCard title="Top destinations" subtitle="Where visitors clicked through to" rows={destinationRows(analytics.topDestinations)} />
      </div>

      <Card
        title="Recent clicks"
        subtitle="Latest tracked link opens"
        action={
          analytics.recent.length > 0 ? (
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <Download size={13} /> CSV
            </button>
          ) : null
        }
      >
        {analytics.recent.length === 0 ? (
          <p className="text-[13.5px] text-center py-12" style={{ color: "var(--body)" }}>
            No tracked clicks yet. Send email with same-site links, or use tracked
            redirect links, to start collecting traffic sources.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr style={{ color: "var(--body)" }}>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">When</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Source</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Recipient</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Campaign</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Template</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {analytics.recent.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "var(--body)" }}>
                      {timeAgo(row.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4">
                      {(() => {
                        const style = sourceStyle(row.source);
                        return (
                          <span
                            className="rounded-full px-2 py-[3px] text-[10.5px] font-semibold whitespace-nowrap"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {sourceLabel(row.source)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-2.5 pr-4 font-medium" style={{ color: "var(--ink)" }}>
                      {row.recipient || <span style={{ color: "var(--body)" }}>—</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="rounded-full px-2 py-[3px] font-mono text-[10.5px] font-semibold"
                        style={{ background: "rgba(110,76,255,0.1)", color: BRAND }}
                      >
                        {row.campaign}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11.5px]" style={{ color: "var(--body)" }}>
                      {row.templateId || "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <a
                        href={row.destination}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11.5px] hover:underline"
                        style={{ color: EMERALD }}
                      >
                        {row.destination}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
