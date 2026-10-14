"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DateRangePicker } from "@/components/dashboard/reports/date-range-picker";
import { OverviewMetrics } from "@/components/dashboard/reports/overview-metrics";
import { GrowthChart } from "@/components/dashboard/reports/growth-chart";
import { TopCourses } from "@/components/dashboard/reports/top-courses";
import { OrderStatusChart } from "@/components/dashboard/reports/order-status-chart";
import { OrderTrendsChart } from "@/components/dashboard/reports/order-trends-chart";
import { OverviewRecentOrders } from "@/components/dashboard/reports/overview-recent-orders";
import { RecentSignups } from "@/components/dashboard/reports/recent-signups";
import { PlatformActivity } from "@/components/dashboard/reports/platform-activity";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { useCurrency } from "@/components/dashboard/currency-context";
import {
  dashboardRangeQuery,
  resolveDashboardRange,
  type DashboardRangeSelection,
} from "@/lib/admin/dashboard-range";
import type { AdminDashboardActivity } from "@/lib/dashboard/admin";
import type { AdminOverviewAnalytics } from "@/lib/admin/overview-analytics-types";

export function AdminDashboard({
  initialAnalytics,
  activity,
}: {
  initialAnalytics: AdminOverviewAnalytics;
  activity: AdminDashboardActivity;
}) {
  const [selection, setSelection] = useState<DashboardRangeSelection>({ period: "30d" });
  const [analytics, setAnalytics] = useState<AdminOverviewAnalytics>(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currency } = useCurrency();

  const isDefault = selection.period === "30d" && currency === (initialAnalytics.currency ?? "USD");

  useEffect(() => {
    if (isDefault) {
      setAnalytics(initialAnalytics);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = dashboardRangeQuery(selection);
    fetch(`/api/admin/overview?${query}&currency=${currency}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error ?? "Failed to load analytics");
        return body as AdminOverviewAnalytics;
      })
      .then((res) => {
        if (!cancelled) setAnalytics(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selection, currency, isDefault, initialAnalytics]);

  let range = null;
  try {
    range = resolveDashboardRange(selection);
  } catch {
    range = null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        subtitle="Guardianship of your FlyBridge platform at a glance."
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

      <OverviewMetrics metrics={analytics.metrics} />

      <div className="grid xl:grid-cols-2 gap-5">
        <GrowthChart
          data={analytics.growth}
          subtitle={`New signups per day · ${analytics.range.label}`}
        />
        <OrderTrendsChart
          data={analytics.orderTrend}
          subtitle={`Completed revenue and all orders · ${analytics.range.label}`}
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <TopCourses items={analytics.topItems} />
        </div>
        <OrderStatusChart data={analytics.orderStatuses} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <OverviewRecentOrders orders={analytics.recentOrders} />
        <RecentSignups signups={activity.signups} />
        <PlatformActivity items={activity.activity} />
      </div>
    </div>
  );
}
