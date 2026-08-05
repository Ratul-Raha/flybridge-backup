import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionTabs } from "@/components/dashboard/user/section-tabs";
import { AllCourses } from "@/components/dashboard/user/all-courses";

export const metadata: Metadata = {
  title: "Courses | FlyBridge",
};

export default async function CoursesPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role === "moderator" || session.role === "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Courses"
        subtitle="Practical programs to prepare your international future."
      />
      <SectionTabs parent="courses" active="all" />
      <AllCourses />
    </div>
  );
}
