import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { getAdminDashboardData } from "@/lib/dashboard/admin";

export const metadata: Metadata = {
  title: "Admin | FlyBridge",
};

export default async function AdminPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const initial = await getAdminDashboardData();
  return <AdminDashboard initial={initial} />;
}
