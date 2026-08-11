import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { RunsHistory } from "@/components/dashboard/automations/runs-history";

export const metadata: Metadata = {
  title: "Automation Runs | FlyBridge",
};

export default async function AutomationRunsPage({ params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <RunsHistory id={params.id} />;
}
