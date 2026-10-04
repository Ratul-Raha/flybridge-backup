import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";
import { MockTestManage } from "@/components/mock-tests/mock-test-manage";

export const metadata: Metadata = {
  title: "New Mock Test | FlyBridge",
};

type Props = {
  searchParams: { bundle?: string };
};

export default async function NewMockTestPage({ searchParams }: Props) {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role !== "moderator" && session.role !== "admin") {
    redirect("/dashboard");
  }

  await connectDb();
  const bundleId = searchParams.bundle ?? "";
  if (!bundleId) {
    redirect("/dashboard/mock-tests");
  }
  const bundle = await MockTestBundle.findById(bundleId).select("_id").lean();
  if (!bundle) {
    redirect("/dashboard/mock-tests");
  }

  return <MockTestManage createInBundle={bundleId} />;
}
