import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { RolePermissions } from "@/components/dashboard/role-permissions";

export const metadata: Metadata = {
  title: "Roles & Permissions | FlyBridge",
};

export default async function RolesPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  // Only admins may change roles, so moderators cannot see this page at all.
  if (session.role !== "admin") redirect("/dashboard/profile");
  return <RolePermissions />;
}