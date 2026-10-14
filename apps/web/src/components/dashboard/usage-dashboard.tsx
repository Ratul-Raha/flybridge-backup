"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DateRangePicker } from "@/components/dashboard/reports/date-range-picker";
import { UsageMetrics } from "@/components/dashboard/reports/usage-metrics";
import { UsageTrendChart } from "@/components/dashboard/reports/usage-trend-chart";
import { TopLessons, TopPages, TopQuizzes } from "@/components/dashboard/reports/usage-rankings";
import { AiInsights } from "@/components/dashboard/reports/ai-insights";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { useCurrency } from "@/components/dashboard/currency-context";
import {
  dashboardRangeQuery,
  resolveDashboardRange,
  type DashboardRangeSelection,
} from "@/lib/admin/dashboard-range";
import type { AdminUsageAnalytics } from "@/lib/admin/overview-analytics-types";

export function UsageDashboard({ initialUsage }: { initialUsage: AdminUsageAnalytics }) {
  const [selection, setSelection] = useState<DashboardRangeSelection>({ period: "30d" });
  const [analytics, setAnalytics] = useState<AdminUsageAnalytics>(initialUsage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currency } = useCurrency();

  const isDefault = selection.period === "30d" && currency === (initialUsage.currency ?? "USD");

  useEffect(() => {
    if (isDefault) {
      setAnalytics(initialUsage);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = dashboardRangeQuery(selection);
    fetch(`/api/admin/usage?${query}&currency=${currency}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error ?? "Failed to load usage analytics");
        return body as AdminUsageAnalytics;
      })
      .then((res) => {
        if (!cancelled) setAnalytics(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load usage analytics");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selection, currency, isDefault, initialUsage]);

  let range = null;
  try {
    range = resolveDashboardRange(selection);
  } catch {
    range = null;
  }

  const query = `${dashboardRangeQuery(selection)}&currency=${currency}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usage Analytics"
        subtitle="How members are actually using FlyBridge — pages, lessons and quizzes."
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

      <UsageMetrics analytics={analytics} loading={loading} />

      <UsageTrendChart
        data={analytics.usageTrend}
        subtitle={`Member activity per day · ${analytics.range.label}`}
      />

      <div className="grid xl:grid-cols-3 gap-5">
        <TopPages pages={analytics.topPages} loading={loading} />
        <TopLessons lessons={analytics.topLessons} loading={loading} />
        <TopQuizzes quizzes={analytics.topQuizzes} loading={loading} />
      </div>

      <AiInsights query={query} canGenerate={!loading} />
    </div>
  );
}
