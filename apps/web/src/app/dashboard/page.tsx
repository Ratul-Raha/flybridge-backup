import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardHome } from "@/components/dashboard/user/dashboard-home";
import { getUserDashboardData } from "@/lib/dashboard/user";

export default async function DashboardIndex() {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role === "admin") redirect("/dashboard/admin");
  if (session.role === "moderator") redirect("/dashboard/seminars");

  const initial = session.userId
    ? await getUserDashboardData(session.userId, session.email)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your FlyBridge learning overview."
      />
      <DashboardHome initial={initial} />
    </div>
  );
}
