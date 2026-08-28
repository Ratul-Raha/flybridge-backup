import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { ScholarshipBrowser } from "@/components/dashboard/user/scholarship-browser";

export const metadata: Metadata = {
  title: "Scholarships | FlyBridge",
};

export default async function ScholarshipsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  return <ScholarshipBrowser />;
}