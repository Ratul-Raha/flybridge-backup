import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { RefundRequest } from "@/lib/models/refund-request";
import { RefundManage } from "@/components/dashboard/refund-manage";

export const metadata: Metadata = {
  title: "Refunds | FlyBridge",
};

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  await connectDb();
  const requests = await RefundRequest.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("user", "name email")
    .lean();

  return (
    <RefundManage
      rows={requests.map((r) => ({
        id: r._id.toString(),
        orderId: r.order.toString(),
        itemTitle: r.itemTitle ?? "",
        amount: r.amount ?? 0,
        currency: r.currency ?? "USD",
        gateway: r.gateway ?? "",
        reason: r.reason ?? "",
        status: r.status,
        userName:
          r.user && typeof r.user === "object" && "name" in r.user
            ? String((r.user as { name?: string }).name ?? "")
            : "",
        userEmail:
          r.user && typeof r.user === "object" && "email" in r.user
            ? String((r.user as { email?: string }).email ?? "")
            : "",
        lessonsPlayed: r.lessonsPlayedAtClaim ?? 0,
        mockTestsPlayed: r.mockTestsPlayedAtClaim ?? 0,
        adminNote: r.adminNote ?? "",
        failureReason: r.failureReason ?? "",
        createdAt: r.createdAt.toISOString(),
        decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
      }))}
    />
  );
}
