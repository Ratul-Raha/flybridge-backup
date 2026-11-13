import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { LeadDetail } from "@/components/dashboard/leads/lead-detail";

export const metadata: Metadata = {
  title: "Lead | FlyBridge",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <LeadDetail id={params.id} />;
}
