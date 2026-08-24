import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { CourseEnrollments } from "@/components/dashboard/course-enrollments";

export const metadata: Metadata = {
  title: "Course Members | FlyBridge",
};

export default async function CourseEnrollmentsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator") {
    redirect("/dashboard");
  }

  return <CourseEnrollments courseId={params.id} />;
}
