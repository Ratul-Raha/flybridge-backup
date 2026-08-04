import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

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

  return <DashboardLayout>{children}</DashboardLayout>;
}
