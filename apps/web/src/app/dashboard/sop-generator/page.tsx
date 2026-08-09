import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SopGenerator } from "@/components/dashboard/user/sop-generator";

export const metadata: Metadata = {
  title: "SOP Generator | FlyBridge",
};

export default async function SopGeneratorPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SOP Generator"
        subtitle="Create a strong Statement of Purpose for your study applications with AI assistance."
      />
      <SopGenerator />
    </div>
  );
}
