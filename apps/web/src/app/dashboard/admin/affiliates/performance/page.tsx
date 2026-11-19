import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AffiliatePerformance } from "@/components/dashboard/affiliate/affiliate-performance";

export const metadata: Metadata = {
  title: "Affiliate Performance | FlyBridge",
};

export default async function AffiliatePerformancePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <AffiliatePerformance />;
}
