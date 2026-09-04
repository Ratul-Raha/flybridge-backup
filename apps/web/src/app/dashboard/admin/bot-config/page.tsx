import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { BotConfigPanel } from "@/components/ops-bot/config/config-panel";

export const metadata: Metadata = {
  title: "Bot Configuration | FlyBridge Admin",
};

export default async function BotConfigPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <BotConfigPanel />;
}
