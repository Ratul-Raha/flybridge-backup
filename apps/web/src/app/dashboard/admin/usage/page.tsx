import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { UsageDashboard } from "@/components/dashboard/usage-dashboard";
import { getUsageAnalytics } from "@/lib/admin/overview-analytics";

export const metadata: Metadata = {
  title: "Usage Analytics | FlyBridge",
};

export default async function UsagePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const usage = await getUsageAnalytics({ period: "30d" }, "USD");

  return <UsageDashboard initialUsage={usage} />;
}
