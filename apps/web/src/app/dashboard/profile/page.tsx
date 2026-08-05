import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { GeneralUserDashboard } from "@/components/dashboard/general-user-dashboard";

export const metadata: Metadata = {
  title: "My Profile | FlyBridge",
};

export default async function ProfilePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  return <GeneralUserDashboard />;
}
