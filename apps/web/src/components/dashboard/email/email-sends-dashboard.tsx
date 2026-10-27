"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { Download, Mail, MousePointerClick, Percent, Send, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/dashboard/reports/card";
import { Chart } from "@/components/dashboard/reports/echart";
import { DateRangePicker } from "@/components/dashboard/reports/date-range-picker";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { BRAND, EMERALD, SKY, SPLIT_LINE, AXIS_LABEL, timeAgo } from "@/components/dashboard/reports/lib";
import { csvFilename, downloadCsv } from "@/lib/csv";
import {
  dashboardRangeQuery,
  resolveDashboardRange,
  type DashboardRangeSelection,
} from "@/lib/admin/dashboard-range";
import type { AdminEmailSendAnalytics } from "@/lib/admin/email-sends-types";
import { EmailCampaignModal } from "@/components/dashboard/email/email-campaign-modal";

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

export function EmailSendsDashboard({
  initialAnalytics,
}: {
  initialAnalytics: AdminEmailSendAnalytics;
}) {
  const [selection, setSelection] = useState<DashboardRangeSelection>({ period: "30d" });
  const [analytics, setAnalytics] = useState<AdminEmailSendAnalytics>(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const isDefault = selection.period === "30d";

  const reload = async () => {
    const res = await fetch(`/api/admin/email-sends?${dashboardRangeQuery(selection)}`, { cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? "Failed to load email stats");
    setAnalytics(body as AdminEmailSendAnalytics);
  };

  useEffect(() => {
    if (isDefault) {
      setAnalytics(initialAnalytics);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    reload()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load email stats");
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
      grid: { left: 8, right: 8, top: 30, bottom: 0, containLabel: true },
      tooltip: { trigger: "axis" },
      legend: { data: ["Emails sent", "Clicks"], top: 0, textStyle: { color: AXIS_LABEL, fontSize: 11 } },
      xAxis: {
        type: "category",
        data: analytics.trend.labels,
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10 },
      },
      yAxis: [
        {
          type: "value",
          splitLine: { lineStyle: { color: SPLIT_LINE } },
          axisLabel: { color: AXIS_LABEL, fontSize: 10 },
        },
        {
          type: "value",
          minInterval: 1,
          splitLine: { show: false },
          axisLabel: { color: AXIS_LABEL, fontSize: 10 },
        },
      ],
      series: [
        {
          name: "Emails sent",
          type: "bar",
          data: analytics.trend.sent,
          barMaxWidth: 14,
          itemStyle: { color: BRAND, borderRadius: [3, 3, 0, 0] },
        },
        {
          name: "Clicks",
          type: "line",
          yAxisIndex: 1,
          data: analytics.trend.clicks,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 2.5, color: EMERALD },
          itemStyle: { color: EMERALD },
        },
      ],
    };
  }, [analytics]);

  const exportCsv = () => {
    downloadCsv(
      csvFilename("email-sends"),
      ["When", "Kind", "Campaign", "Template", "Subject", "Recipients", "Status"],
      analytics.recent.map((row) => [
        row.createdAt,
        row.kind,
        row.campaign,
        row.templateId,
        row.subject,
        String(row.recipients),
        row.status,
      ]),
    );
  };

  const metrics = analytics.metrics;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Emails"
        subtitle="How many emails you've sent, how they perform, and who clicked through."
        action={
          <div className="flex items-center gap-3">
            {loading && <InlineLoader label="Updating…" />}
            <DateRangePicker value={selection} range={range} onChange={setSelection} />
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              <Send size={13} /> New campaign
            </button>
          </div>
        }
      />

      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-[13px] font-medium"
          style={{ borderColor: "rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.06)", color: "#BE123C" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Emails sent"
          value={metrics.sent.toLocaleString()}
          caption={`${analytics.range.label}`}
          icon={Send}
          gradient="linear-gradient(135deg,#6E4CFF,#8B5CF6)"
        />
        <MetricCard
          label="Send operations"
          value={metrics.operations.toLocaleString()}
          caption="Individual sends / batches"
          icon={Mail}
          gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)"
        />
        <MetricCard
          label="Tracked clicks"
          value={metrics.clicks.toLocaleString()}
          caption="Link clicks on tracked URLs"
          icon={MousePointerClick}
          gradient="linear-gradient(135deg,#10B981,#34D399)"
        />
        <MetricCard
          label="Clicks / email"
          value={metrics.avgClicksPerEmail.toLocaleString()}
          caption="Average URL clicks per email"
          icon={Target}
          gradient="linear-gradient(135deg,#F59E0B,#F97316)"
        />
        <MetricCard
          label="Click-through rate"
          value={`${metrics.clickRate.toLocaleString()}%`}
          caption="Unique clickers ÷ emails sent"
          icon={Percent}
          gradient="linear-gradient(135deg,#EC4899,#F43F5E)"
        />
        <MetricCard
          label="Unique recipients"
          value={metrics.uniqueRecipients.toLocaleString()}
          caption="Distinct people who clicked"
          icon={Users}
          gradient="linear-gradient(135deg,#14B8A6,#2DD4BF)"
        />
      </div>

      <Card title="Sends vs clicks" subtitle={`Emails sent and link clicks per day · ${analytics.range.label}`}>
        {analytics.trend.labels.length > 0 ? (
          <Chart option={option} height={300} />
        ) : (
          <InlineLoader label="Loading trend…" />
        )}
      </Card>

      <Card
        title="Campaign performance"
        subtitle="Emails sent, clicks, and engagement by campaign"
        action={
          analytics.campaigns.length > 0 ? (
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
        {analytics.campaigns.length === 0 ? (
          <p className="text-[13.5px] text-center py-12" style={{ color: "var(--body)" }}>
            No emails sent in this period yet. Click “New campaign” to send your first one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr style={{ color: "var(--body)" }}>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Campaign</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] text-right">Sends</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] text-right">Emails</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] text-right">Clicks</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] text-right">Clicks/email</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {analytics.campaigns.map((row) => (
                  <tr key={row.campaign}>
                    <td className="py-2.5 pr-4">
                      <span
                        className="rounded-full px-2 py-[3px] font-mono text-[10.5px] font-semibold"
                        style={{ background: "rgba(110,76,255,0.1)", color: BRAND }}
                      >
                        {row.campaign}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums" style={{ color: "var(--body)" }}>{row.sends.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right font-medium tabular-nums" style={{ color: "var(--ink)" }}>{row.recipients.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums" style={{ color: "var(--ink)" }}>{row.clicks.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums" style={{ color: "var(--body)" }}>{row.avgClicksPerEmail.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-semibold" style={{ color: EMERALD }}>{row.clickRate.toLocaleString()}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Recent sends" subtitle="Latest email send operations">
        {analytics.recent.length === 0 ? (
          <p className="text-[13.5px] text-center py-12" style={{ color: "var(--body)" }}>
            No sends recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr style={{ color: "var(--body)" }}>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">When</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Kind</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Campaign</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Subject</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] text-right">Recipients</th>
                  <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {analytics.recent.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "var(--body)" }}>
                      {timeAgo(row.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full px-2 py-[3px] text-[10.5px] font-semibold capitalize" style={{ background: "rgba(14,165,233,0.1)", color: SKY }}>
                        {row.kind}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11.5px]" style={{ color: "var(--body)" }}>{row.campaign}</td>
                    <td className="py-2.5 pr-4 max-w-[260px] truncate font-medium" style={{ color: "var(--ink)" }}>{row.subject || "—"}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-medium" style={{ color: "var(--ink)" }}>{row.recipients.toLocaleString()}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="rounded-full px-2 py-[3px] text-[10.5px] font-semibold capitalize"
                        style={
                          row.status === "failed"
                            ? { background: "rgba(244,63,94,0.1)", color: "#BE123C" }
                            : row.status === "partial"
                              ? { background: "rgba(245,158,11,0.1)", color: "#B45309" }
                              : { background: "rgba(16,185,129,0.1)", color: EMERALD }
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {composeOpen && (
        <EmailCampaignModal
          onClose={() => setComposeOpen(false)}
          onSent={() => {
            setComposeOpen(false);
            reload().catch(() => {});
          }}
        />
      )}
    </div>
  );
}
