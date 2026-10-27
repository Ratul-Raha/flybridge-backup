import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { TrafficAnalyticsDashboard } from "@/components/dashboard/traffic-analytics/traffic-analytics-dashboard";
import { getEmailClickAnalytics } from "@/lib/admin/email-clicks";
import { getResourceClickAnalytics } from "@/lib/admin/resource-clicks";

export const metadata: Metadata = {
  title: "Traffic Analytics | FlyBridge",
};

export default async function TrafficAnalyticsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const [emailAnalytics, resourceAnalytics] = await Promise.all([
    getEmailClickAnalytics({ period: "30d" }),
    getResourceClickAnalytics({ period: "30d" }),
  ]);

  return (
    <TrafficAnalyticsDashboard
      initialEmailAnalytics={emailAnalytics}
      initialResourceAnalytics={resourceAnalytics}
    />
  );
}
