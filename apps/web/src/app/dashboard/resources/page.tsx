import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionTabs } from "@/components/dashboard/user/section-tabs";
import { AllResources } from "@/components/dashboard/user/all-resources";
import { ResourceManage } from "@/components/dashboard/resource-manage";

export const metadata: Metadata = {
  title: "Resources | FlyBridge",
};

export default async function ResourcesPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role === "moderator" || session.role === "admin") {
    return <ResourceManage />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resources"
        subtitle="Guides, templates and toolkits for your journey."
      />
      <SectionTabs parent="resources" active="all" />
      <AllResources />
    </div>
  );
}
