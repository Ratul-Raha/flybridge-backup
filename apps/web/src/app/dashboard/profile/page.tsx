import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { ProfileDashboard } from "@/components/dashboard/profile-dashboard";

export const metadata: Metadata = {
  title: "My Profile | FlyBridge",
};

export default async function ProfilePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  return <ProfileDashboard />;
}
