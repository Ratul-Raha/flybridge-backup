import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { AutomationEditor } from "@/components/dashboard/automations/automation-editor";

export const metadata: Metadata = {
  title: "Edit Automation | FlyBridge",
};

export default async function AutomationEditorPage({ params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <AutomationEditor id={params.id} />;
}
