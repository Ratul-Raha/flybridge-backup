import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { MyOrders } from "@/components/dashboard/user/my-orders";
import { orderRowsForUser } from "@/lib/refunds";

export const metadata: Metadata = {
  title: "My Orders | FlyBridge",
};

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.userId) redirect("/dashboard");

  const rows = await orderRowsForUser(session.userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Orders"
        subtitle="Every purchase you have made, and where its 3-day refund stands."
      />
      <MyOrders rows={rows} />
    </div>
  );
}
