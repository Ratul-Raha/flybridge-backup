import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionTabs } from "@/components/dashboard/user/section-tabs";
import { MyCourses } from "@/components/dashboard/user/my-courses";

export const metadata: Metadata = {
  title: "My Courses | FlyBridge",
};

export default async function MyCoursesPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role === "moderator" || session.role === "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Courses"
        subtitle="Your enrolled programs and progress."
      />
      <SectionTabs parent="courses" active="mine" />
      <MyCourses />
    </div>
  );
}
