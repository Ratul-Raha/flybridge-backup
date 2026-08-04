import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";

export default async function DashboardIndex() {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role === "admin") redirect("/dashboard/admin");
  if (session.role === "moderator") redirect("/dashboard/seminars");
  redirect("/dashboard/profile");
}
