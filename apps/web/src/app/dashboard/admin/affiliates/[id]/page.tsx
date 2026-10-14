import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AffiliateDetail } from "@/components/dashboard/affiliate/affiliate-detail";

export const metadata: Metadata = {
  title: "Affiliate | FlyBridge",
};

export default async function AffiliateDetailPage({ params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <AffiliateDetail id={params.id} />;
}
