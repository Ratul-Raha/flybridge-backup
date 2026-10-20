import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { ResourceClicksDashboard } from "@/components/dashboard/resource-clicks-dashboard";
import { getResourceClickAnalytics } from "@/lib/admin/resource-clicks";

export const metadata: Metadata = {
  title: "Resource Traffic | FlyBridge",
};

export default async function ResourceClicksPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const analytics = await getResourceClickAnalytics({ period: "30d" });

  return <ResourceClicksDashboard initialAnalytics={analytics} />;
}
