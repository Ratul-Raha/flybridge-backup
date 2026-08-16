import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardReadiness } from "@/components/dashboard/user/dashboard-readiness";

export const metadata: Metadata = {
  title: "Readiness Score | FlyBridge",
};

export default async function ReadinessDashboardPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Readiness Score"
        subtitle="Your study abroad eligibility score, report and the option to regenerate."
      />
      <DashboardReadiness />
    </div>
  );
}
