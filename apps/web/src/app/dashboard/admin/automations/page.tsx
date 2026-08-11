import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AutomationList } from "@/components/dashboard/automations/automation-list";

export const metadata: Metadata = {
  title: "Automations | FlyBridge",
};

export default async function AutomationsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <AutomationList />;
}
