import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { ReadinessManage } from "@/components/dashboard/readiness-manage";

export const metadata: Metadata = {
  title: "Readiness Checks | FlyBridge",
};

export default async function AdminReadinessPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator")
    redirect("/dashboard/profile");
  return <ReadinessManage />;
}