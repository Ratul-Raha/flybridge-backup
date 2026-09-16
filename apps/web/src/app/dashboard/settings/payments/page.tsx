import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PaymentSettingsManage } from "@/components/dashboard/payment-settings-manage";

export const metadata: Metadata = {
  title: "Payment Settings | FlyBridge",
};

export default async function PaymentSettingsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/settings");
  return <PaymentSettingsManage />;
}