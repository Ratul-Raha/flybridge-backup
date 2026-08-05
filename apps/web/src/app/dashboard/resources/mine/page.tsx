import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionTabs } from "@/components/dashboard/user/section-tabs";
import { MyResources } from "@/components/dashboard/user/my-resources";

export const metadata: Metadata = {
  title: "My Resources | FlyBridge",
};

export default async function MyResourcesPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role === "moderator" || session.role === "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Resources"
        subtitle="Resources unlocked for FlyBridge members."
      />
      <SectionTabs parent="resources" active="mine" />
      <MyResources />
    </div>
  );
}
