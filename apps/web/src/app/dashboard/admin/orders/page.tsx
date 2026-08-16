import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { OrderManage } from "@/components/dashboard/order-manage";

export const metadata: Metadata = {
  title: "Orders | FlyBridge",
};

export default async function AdminOrdersPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");
  return <OrderManage />;
}
