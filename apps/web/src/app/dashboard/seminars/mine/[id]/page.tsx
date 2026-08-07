import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { SeminarDetail } from "@/components/dashboard/user/seminar-detail";

export const metadata: Metadata = {
  title: "My Seminar | FlyBridge",
};

export default async function MySeminarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role === "moderator" || session.role === "admin") {
    redirect("/dashboard/seminars");
  }

  return <SeminarDetail seminarId={params.id} />;
}