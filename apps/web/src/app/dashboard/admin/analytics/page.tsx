import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AnalyticsDashboard } from "@/components/dashboard/reports/analytics/analytics-dashboard";

export const metadata: Metadata = {
  title: "Growth & Sales | FlyBridge",
};

export default async function AnalyticsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <AnalyticsDashboard />;
}
