import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { SeminarManage } from "@/components/dashboard/seminar-manage";

export const metadata: Metadata = {
  title: "Seminars | FlyBridge",
};

export default async function SeminarsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "moderator" && session.role !== "admin") {
    redirect("/dashboard/profile");
  }
  return <SeminarManage />;
}