import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { MockTestManage } from "@/components/mock-tests/mock-test-manage";

export const metadata: Metadata = {
  title: "Mock Tests | FlyBridge",
};

export default async function DashboardMockTestsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role !== "moderator" && session.role !== "admin") {
    redirect("/dashboard");
  }

  return <MockTestManage />;
}