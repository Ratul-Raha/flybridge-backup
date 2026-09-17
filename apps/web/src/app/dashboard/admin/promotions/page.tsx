import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PromotionManage } from "@/components/dashboard/promotion-manage";

export const metadata: Metadata = {
  title: "Promotions | FlyBridge",
};

export default async function PromotionsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <PromotionManage />;
}
