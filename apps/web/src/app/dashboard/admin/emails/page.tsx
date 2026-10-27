import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { EmailSendsDashboard } from "@/components/dashboard/email/email-sends-dashboard";
import { getEmailSendAnalytics } from "@/lib/admin/email-sends";

export const metadata: Metadata = {
  title: "Emails | FlyBridge",
};

export default async function EmailsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const analytics = await getEmailSendAnalytics({ period: "30d" });

  return <EmailSendsDashboard initialAnalytics={analytics} />;
}
