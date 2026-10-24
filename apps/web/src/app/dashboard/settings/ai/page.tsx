import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AiSettingsManage } from "@/components/dashboard/ai-settings-manage";

export const metadata: Metadata = {
  title: "AI Provider | FlyBridge",
};

export default async function AiSettingsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/settings");
  return <AiSettingsManage />;
}
