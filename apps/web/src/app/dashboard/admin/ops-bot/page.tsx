import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { OpsBotChat } from "@/components/ops-bot/chat-interface";

export const metadata: Metadata = {
  title: "Ops Bot | FlyBridge Admin",
};

export default async function OpsBotPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <OpsBotChat />;
}
