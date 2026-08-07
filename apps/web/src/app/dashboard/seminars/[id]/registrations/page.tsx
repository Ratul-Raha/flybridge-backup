import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { SeminarRegistrations } from "@/components/dashboard/seminar-registrations";

export const metadata: Metadata = {
  title: "Seminar Registrations | FlyBridge",
};

export default async function SeminarRegistrationsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator") {
    redirect("/dashboard");
  }

  return <SeminarRegistrations seminarId={params.id} />;
}