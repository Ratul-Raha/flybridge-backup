import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { ScholarshipManage } from "@/components/dashboard/scholarship-manage";

export const metadata: Metadata = {
  title: "Manage Scholarships | FlyBridge",
};

export default async function ScholarshipManagePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator") redirect("/dashboard");

  return <ScholarshipManage />;
}