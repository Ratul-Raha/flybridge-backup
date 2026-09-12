import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest } from "@/lib/models/mock-test";
import { resolveMockTestOwnership, testIsOwned } from "@/lib/mock-tests";
import { MockTestPlayer } from "@/components/mock-tests/mock-test-player";

export const metadata: Metadata = {
  title: "Mock Test | FlyBridge",
};

type Props = {
  params: { testId: string };
  searchParams: { attempt?: string };
};

export default async function TestTakePage({ params, searchParams }: Props) {
  const session = await readSession();
  if (!session || !session.userId) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/mock-tests/${params.testId}/take`)}`);
  }

  await connectDb();
  const test = await MockTest.findById(params.testId);
  if (!test) {
    return (
      <LockedScreen
        title="This test isn&apos;t available"
        desc="The test you're looking for could not be found."
        href="/dashboard/mock-tests"
        label="Back to mock tests"
      />
    );
  }

  const isStaff = session.role === "admin" || session.role === "moderator";
  const ownership = await resolveMockTestOwnership(session.userId);
  const owned = testIsOwned(ownership, test);

  if (!isStaff && test.status !== "published") {
    return (
      <LockedScreen
        title="This test isn&apos;t live yet"
        desc="The test opens as soon as it is published. Check back soon."
        href="/dashboard/mock-tests"
        label="Back to mock tests"
      />
    );
  }

  if (!isStaff && !owned) {
    return (
      <LockedScreen
        title="This test is part of a practice pack"
        desc="Buy the pack to unlock this test with unlimited attempts and AI band feedback."
        href={test.bundle ? `/mock-tests/${test.bundle.toString()}` : "/dashboard/mock-tests"}
        label="View pack"
      />
    );
  }

  return <MockTestPlayer testId={params.testId} attemptId={searchParams.attempt} />;
}

function LockedScreen({
  title,
  desc,
  href,
  label,
}: {
  title: string;
  desc: string;
  href: string;
  label: string;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <p className="font-display text-[20px] font-semibold" style={{ color: "var(--ink)" }}>
        {title}
      </p>
      <p className="text-[14px] max-w-[420px]" style={{ color: "var(--body)" }}>
        {desc}
      </p>
      <a
        href={href}
        className="rounded-full text-white text-[14px] font-medium px-6 py-[11px] hover:opacity-90 transition-opacity"
        style={{ background: "var(--brand)" }}
      >
        {label}
      </a>
    </div>
  );
}