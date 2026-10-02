import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest } from "@/lib/models/mock-test";
import { MockTestManage } from "@/components/mock-tests/mock-test-manage";

export const metadata: Metadata = {
  title: "Edit Mock Test | FlyBridge",
};

type Props = {
  params: { testId: string };
};

export default async function EditMockTestPage({ params }: Props) {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role !== "moderator" && session.role !== "admin") {
    redirect("/dashboard");
  }

  await connectDb();
  const test = await MockTest.findById(params.testId).select("bundle").lean();
  if (!test) {
    redirect("/dashboard/mock-tests");
  }

  const bundleId = test.bundle ? test.bundle.toString() : "";

  return <MockTestManage focusBundleId={bundleId} focusTestId={params.testId} />;
}
