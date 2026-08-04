import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Moderator | FlyBridge",
};

export default async function ModeratorPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "moderator" && session.role !== "admin") {
    redirect("/dashboard/profile");
  }
  redirect("/dashboard/seminars");
}