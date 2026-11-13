import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { GoogleFormsIntegrations } from "@/components/dashboard/leads/google-forms-integrations";

export const metadata: Metadata = {
  title: "CRM · Integrations | FlyBridge",
};

export default async function CrmIntegrationsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <GoogleFormsIntegrations />;
}
