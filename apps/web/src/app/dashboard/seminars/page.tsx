import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { SeminarManage } from "@/components/dashboard/seminar-manage";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionTabs } from "@/components/dashboard/user/section-tabs";
import { AllSeminars } from "@/components/dashboard/user/all-seminars";

export const metadata: Metadata = {
  title: "Seminars | FlyBridge",
};

export default async function SeminarsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role === "moderator" || session.role === "admin") {
    return <SeminarManage />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Seminars"
        subtitle="Browse all seminars — upcoming and recent."
      />
      <SectionTabs parent="seminars" active="all" />
      <AllSeminars />
    </div>
  );
}
