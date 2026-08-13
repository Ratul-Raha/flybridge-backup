import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { UserManage } from "@/components/dashboard/user-manage";

export const metadata: Metadata = {
  title: "Users | FlyBridge",
};

export default async function UsersPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator") redirect("/dashboard/profile");
  return <UserManage />;
}