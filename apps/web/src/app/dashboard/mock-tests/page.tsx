import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { MockTestManage } from "@/components/mock-tests/mock-test-manage";
import { DashboardMockTests } from "@/components/mock-tests/dashboard-mock-tests";

export const metadata: Metadata = {
  title: "Mock Tests | FlyBridge",
};

export default async function DashboardMockTestsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role === "moderator" || session.role === "admin") {
    return <MockTestManage />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mock Tests"
        subtitle="Your IELTS practice tests and band-score history."
      />
      <DashboardMockTests />
    </div>
  );
}