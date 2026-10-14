import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { getAdminDashboardActivity } from "@/lib/dashboard/admin";
import { getOverviewAnalytics } from "@/lib/admin/overview-analytics";

export const metadata: Metadata = {
  title: "Admin | FlyBridge",
};

export default async function AdminPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const [analytics, activity] = await Promise.all([
    getOverviewAnalytics({ period: "30d" }, "USD"),
    getAdminDashboardActivity(),
  ]);

  return <AdminDashboard initialAnalytics={analytics} activity={activity} />;
}
