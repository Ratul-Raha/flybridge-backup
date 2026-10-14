import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { AffiliateDashboard } from "@/components/dashboard/affiliate/affiliate-dashboard";

export const metadata: Metadata = {
  title: "Affiliate | FlyBridge",
};

export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.userId) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Affiliate"
        subtitle="Share your link, track the sales it brings in, and where your earnings stand."
      />
      <AffiliateDashboard />
    </div>
  );
}
