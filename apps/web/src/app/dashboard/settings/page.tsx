import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/dashboard/user/settings-form";

export const metadata: Metadata = {
  title: "Settings | FlyBridge",
};

export default async function SettingsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your personal information and account details."
      />
      <SettingsForm />
    </div>
  );
}
