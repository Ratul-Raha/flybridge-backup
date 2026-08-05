import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await readSession();
  if (!session) redirect("/login");
  redirect("/dashboard/settings");
}
