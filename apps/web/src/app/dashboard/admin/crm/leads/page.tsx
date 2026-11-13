import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { LeadManage } from "@/components/dashboard/leads/lead-manage";

export const metadata: Metadata = {
  title: "CRM · Leads | FlyBridge",
};

export default async function CrmLeadsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <LeadManage />;
}
