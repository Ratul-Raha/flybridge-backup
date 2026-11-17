import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { LeadForms } from "@/components/dashboard/leads/lead-forms";

export const metadata: Metadata = {
  title: "CRM · Forms | FlyBridge",
};

export default async function CrmFormsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <LeadForms />;
}
