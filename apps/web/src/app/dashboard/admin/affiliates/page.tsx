import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AffiliateManage } from "@/components/dashboard/affiliate/affiliate-manage";

export const metadata: Metadata = {
  title: "Affiliates | FlyBridge",
};

export default async function AffiliatesPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <AffiliateManage />;
}
