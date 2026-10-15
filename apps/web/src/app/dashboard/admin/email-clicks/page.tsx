import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { EmailClicksDashboard } from "@/components/dashboard/email/email-clicks-dashboard";
import { getEmailClickAnalytics } from "@/lib/admin/email-clicks";

export const metadata: Metadata = {
  title: "Email Clicks | FlyBridge",
};

export default async function EmailClicksPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const analytics = await getEmailClickAnalytics({ period: "30d" });

  return <EmailClicksDashboard initialAnalytics={analytics} />;
}
