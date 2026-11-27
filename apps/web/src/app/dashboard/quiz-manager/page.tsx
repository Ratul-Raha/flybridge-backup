import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { QuizManager } from "@/components/dashboard/quiz-manager";

export const metadata: Metadata = {
  title: "Quiz Manager | FlyBridge",
};

export default async function QuizManagerPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator") redirect("/dashboard");
  return <QuizManager />;
}
