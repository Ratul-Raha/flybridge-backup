"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCards } from "@/components/dashboard/reports/stat-cards";
import { GrowthChart } from "@/components/dashboard/reports/growth-chart";
import { TopCourses } from "@/components/dashboard/reports/top-courses";
import { SubscriptionPie } from "@/components/dashboard/reports/subscription-pie";
import { RecentSignups } from "@/components/dashboard/reports/recent-signups";
import { PlatformActivity } from "@/components/dashboard/reports/platform-activity";
import { OrderOverview } from "@/components/dashboard/reports/order-overview";
import { useCurrency } from "@/components/dashboard/currency-context";
import type { AdminDashboardData } from "@/lib/dashboard/admin";
import type { OrderStats } from "@/lib/admin/orders-stats";

export function AdminDashboard({ initial }: { initial: AdminDashboardData }) {
  const [orders, setOrders] = useState<OrderStats>(initial.orders);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const { currency } = useCurrency();

  // The initial render is server-computed for USD. Switching the admin
  // currency refetches order stats once and feeds both OrderOverview and
  // TopCourses from the same payload.
  useEffect(() => {
    if (currency === (orders.currency ?? "USD")) return;
    let cancelled = false;
    setOrdersLoading(true);
    fetch(`/api/admin/orders-stats?currency=${currency}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!cancelled && res) setOrders(res as OrderStats);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" subtitle="Guardianship of your FlyBridge platform at a glance." />

      <StatCards data={initial.overview} />

      <OrderOverview data={ordersLoading ? null : orders} />

      <div className="grid xl:grid-cols-3 gap-5">
        <GrowthChart data={initial.growth} />
        <TopCourses items={orders.topItems} loading={ordersLoading} />
        <SubscriptionPie data={initial.split} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <RecentSignups signups={initial.signups} />
        <PlatformActivity items={initial.activity} />
      </div>
    </div>
  );
}
