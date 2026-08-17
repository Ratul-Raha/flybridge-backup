"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCards } from "@/components/dashboard/reports/stat-cards";
import { GrowthChart } from "@/components/dashboard/reports/growth-chart";
import { TopCourses } from "@/components/dashboard/reports/top-courses";
import { SubscriptionPie } from "@/components/dashboard/reports/subscription-pie";
import { RecentSignups } from "@/components/dashboard/reports/recent-signups";
import { RecentOrders } from "@/components/dashboard/reports/recent-orders";
import { PlatformActivity } from "@/components/dashboard/reports/platform-activity";
import { OrderOverview } from "@/components/dashboard/reports/order-overview";

export function AdminDashboard() {
  const { user } = useAuth();

  if (!user) return <p style={{ color: "var(--body)" }}>Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" subtitle="Guardianship of your FlyBridge platform at a glance." />

      <StatCards />

      <OrderOverview />

      <div className="grid xl:grid-cols-3 gap-5">
        <GrowthChart />
        <TopCourses />
        <SubscriptionPie />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <RecentSignups />
        <RecentOrders />
        <PlatformActivity />
      </div>
    </div>
  );
}