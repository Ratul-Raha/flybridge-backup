import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getUserDashboardData } from "@/lib/dashboard/user";

export const metadata: Metadata = {
  title: "Dashboard | FlyBridge Education Group",
};

export default async function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) redirect("/login");

  const dashboardInitial =
    session.userId && session.role === "user"
      ? await getUserDashboardData(session.userId, session.email)
      : null;

  return <DashboardLayout dashboardInitial={dashboardInitial}>{children}</DashboardLayout>;
}
