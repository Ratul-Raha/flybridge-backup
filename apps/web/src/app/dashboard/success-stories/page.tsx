import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { SuccessStoryManage } from "@/components/dashboard/success-story-manage";

export const metadata: Metadata = {
  title: "Success Stories | FlyBridge",
};

export default async function SuccessStoriesManagePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator") redirect("/dashboard");

  return <SuccessStoryManage />;
}
