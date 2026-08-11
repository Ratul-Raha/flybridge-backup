import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { EventLogView } from "@/components/dashboard/automations/event-log-view";

export const metadata: Metadata = {
  title: "Event Log | FlyBridge",
};

export default async function EventsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <EventLogView />;
}
