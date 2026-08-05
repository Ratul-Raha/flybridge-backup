import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionTabs } from "@/components/dashboard/user/section-tabs";
import { MySeminars } from "@/components/dashboard/user/my-seminars";

export const metadata: Metadata = {
  title: "My Seminars | FlyBridge",
};

export default async function MySeminarsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role === "moderator" || session.role === "admin") {
    redirect("/dashboard/seminars");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Seminars"
        subtitle="The seminars you've registered for."
      />
      <SectionTabs parent="seminars" active="mine" />
      <MySeminars />
    </div>
  );
}
