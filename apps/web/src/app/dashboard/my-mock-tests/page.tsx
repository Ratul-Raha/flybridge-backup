import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, Lock } from "lucide-react";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { MockTest } from "@/lib/models/mock-test";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";
import { resolveMockTestOwnership, testIsOwned } from "@/lib/mock-tests";
import { PageHeader } from "@/components/dashboard/page-header";
import { MockTestProgress } from "@/components/mock-tests/mock-test-progress";
import { BengaliText } from "@/components/bengali-text";

export const metadata: Metadata = {
  title: "Mock Exams | FlyBridge",
};

export const dynamic = "force-dynamic";

const SKILL_LABEL: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

const SKILL_ORDER = ["reading", "listening", "writing", "speaking"] as const;

type TestRow = {
  id: string;
  title: string;
  skill: string;
  durationMinutes: number;
  questionCount: number;
  owned: boolean;
  attempts: number;
  bestBand: number | null;
};

export default async function MyMockTestsPage() {
  const session = await readSession();
  if (!session) redirect("/login?next=%2Fdashboard%2Fmy-mock-tests");
  const userId = session.userId;
  if (!userId) redirect("/dashboard");

  await connectDb();
  const ownership = await resolveMockTestOwnership(userId);

  const [tests, attempts] = await Promise.all([
    MockTest.find({ status: "published" })
      .select("title skill durationMinutes questionCount bundle course order")
      .sort({ skill: 1, bundle: 1, order: 1, createdAt: 1 })
      .lean(),
    MockTestAttempt.find({ user: userId, status: "graded" })
      .select("test result")
      .sort({ submittedAt: -1 })
      .limit(200)
      .lean(),
  ]);

  const attemptStats = new Map<string, { count: number; best: number | null }>();
  for (const attempt of attempts) {
    const testId = attempt.test.toString();
    const band =
      attempt.result && typeof attempt.result === "object"
        ? ((attempt.result as { overallBand?: number }).overallBand ?? null)
        : null;
    const current = attemptStats.get(testId) ?? { count: 0, best: null };
    current.count += 1;
    if (typeof band === "number") {
      current.best = current.best === null ? band : Math.max(current.best, band);
    }
    attemptStats.set(testId, current);
  }

  const rows: TestRow[] = tests.map((t) => {
    const stats = attemptStats.get(t._id.toString());
    return {
      id: t._id.toString(),
      title: t.title,
      skill: t.skill,
      durationMinutes: t.durationMinutes ?? 0,
      questionCount: t.questionCount ?? 0,
      owned: testIsOwned(ownership, t),
      attempts: stats?.count ?? 0,
      bestBand: stats?.best ?? null,
    };
  });

  const available = rows.filter((r) => r.owned);
  const locked = rows.filter((r) => !r.owned);
  const categoryGroups = (items: TestRow[]) =>
    SKILL_ORDER.map((skill) => ({
      skill,
      rows: items.filter((row) => row.skill === skill),
    })).filter((group) => group.rows.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mock Exams"
        subtitle="Every mock your plan unlocks, in one place. Sitting one is all it takes to see your band score."
      />

      <MockTestProgress />

      {available.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-10 text-center flex flex-col items-center gap-3"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
        >
          <ListChecks className="w-6 h-6" style={{ color: "var(--body)" }} />
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            No mock exams unlocked yet
          </p>
          <p className="text-[13.5px] max-w-[420px]" style={{ color: "var(--body)" }}>
            Mock exams come with your IELTS course and with the standalone mock exam pack. Enrol in a
            course or buy the pack to start practising.
          </p>
          <Link
            href="/dashboard/courses"
            className="inline-block rounded-full text-white text-[13.5px] font-semibold px-6 py-[10px] mt-1"
            style={{ background: "var(--brand)" }}
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {categoryGroups(available).map((group) => (
            <section key={group.skill} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  {SKILL_LABEL[group.skill] ?? group.skill} tests
                </h2>
                <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  {group.rows.length} {group.rows.length === 1 ? "test" : "tests"}
                </span>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {group.rows.map((row) => (
                  <TestCard key={row.id} row={row} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <div className="flex flex-col gap-3.5">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--body)" }}
          >
            Not in your plan
          </p>
          <div className="flex flex-col gap-6">
            {categoryGroups(locked).map((group) => (
              <section key={group.skill} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                    {SKILL_LABEL[group.skill] ?? group.skill} tests
                  </h2>
                  <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                    {group.rows.length} {group.rows.length === 1 ? "test" : "tests"}
                  </span>
                </div>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {group.rows.map((row) => (
                    <TestCard key={row.id} row={row} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
        Mock exams included with a course are part of your 3-day refund window. Playing more than one
        mock exam before you claim keeps the content, but ends that refund.
      </p>
    </div>
  );
}

function TestCard({ row }: { row: TestRow }) {
  const body = (
    <div
      className="h-full rounded-xl border p-5 flex flex-col gap-3 transition-all duration-250"
      style={{
        borderColor: "var(--line)",
        background: row.owned ? "white" : "var(--bg-soft)",
        opacity: row.owned ? 1 : 0.72,
      }}
    >
      <div className="min-w-0">
        <BengaliText>
          <span className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            {row.title}
          </span>
        </BengaliText>
      </div>

      <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
        {[
          row.durationMinutes > 0 ? `${row.durationMinutes} min` : null,
          row.questionCount > 0 ? `${row.questionCount} questions` : null,
          row.attempts > 0 ? `${row.attempts} attempt${row.attempts === 1 ? "" : "s"}` : null,
          row.bestBand !== null ? `Best band ${row.bestBand.toFixed(1)}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Practice paper"}
      </p>

      <div className="mt-auto flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: row.owned ? "var(--brand)" : "var(--body)" }}>
        {row.owned ? (
          <>
            <ListChecks className="w-3.5 h-3.5" />
            {row.attempts > 0 ? "Sit again" : "Start mock"}
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            Locked
          </>
        )}
      </div>
    </div>
  );

  if (!row.owned) return <div>{body}</div>;
  return (
    <Link href={`/dashboard/mock-tests/${row.id}/take`} className="block h-full">
      {body}
    </Link>
  );
}
