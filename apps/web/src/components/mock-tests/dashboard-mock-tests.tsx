"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Lock,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  SKILL_META,
  formatPrice,
  skillLabel,
  type AttemptListItem,
  type TestListItem,
} from "@/lib/mock-test-ui";

type BundleSummary = { id: string; title: string; price: number; currency: string };

export function DashboardMockTests() {
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        fetch("/api/mock-tests", { cache: "no-store" }),
        fetch("/api/mock-tests/attempts", { cache: "no-store" }),
      ]);
      const testsData = await testsRes.json().catch(() => ({ tests: [] }));
      const attemptsData = await attemptsRes.json().catch(() => ({ attempts: [] }));

      const list = Array.isArray(testsData.tests) ? testsData.tests : [];
      setTests(list);
      setAttempts(Array.isArray(attemptsData.attempts) ? attemptsData.attempts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load mock tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ownedTests = tests.filter((t) => t.owned);
  const bundleSummary = useMemo(() => {
    const map = new Map<string, BundleSummary>();
    for (const t of tests) {
      if (!map.has(t.bundle.id)) {
        map.set(t.bundle.id, {
          id: t.bundle.id,
          title: t.bundle.title,
          price: t.bundle.price,
          currency: t.bundle.currency,
        });
      }
    }
    return [...map.values()];
  }, [tests]);

  const avgBand = useMemo(() => {
    const bands = attempts
      .map((a) => a.band)
      .filter((b): b is number => typeof b === "number" && b > 0);
    if (bands.length === 0) return null;
    const avg = bands.reduce((s, b) => s + b, 0) / bands.length;
    return (Math.round(avg * 2) / 2).toFixed(1);
  }, [attempts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-[12.5px] rounded-xl border px-4 py-3" style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}>
          {error}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
        {[
          { label: "Tests you own", value: ownedTests.length, icon: BookOpen, accent: "#6B4CE0", bg: "#F1EEFC" },
          { label: "Attempts", value: attempts.length, icon: History, accent: "#2F5FE0", bg: "#EAF1FF" },
          { label: "Average band", value: avgBand ?? "—", icon: TrendingUp, accent: "#0FA968", bg: "#E8F7F1" },
          { label: "Best band", value: bestBand(attempts), icon: Trophy, accent: "#E08A17", bg: "#FFF2E4" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-[18px] border bg-white p-4 flex items-center gap-3" style={{ borderColor: "var(--line)" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.accent }}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="font-display text-[20px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                  {s.value}
                </div>
                <div className="text-[11px] mt-1 truncate" style={{ color: "var(--body)" }}>
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Owned tests */}
      {ownedTests.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
            Start practicing
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
            {ownedTests.map((t) => {
              const meta = SKILL_META[t.skill] ?? SKILL_META.reading;
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/mock-tests/${t.id}/take`}
                  className="group rounded-[20px] border bg-white p-5 flex flex-col gap-3 transition-all duration-250 hover:-translate-y-[2px] hover:shadow-[0_18px_40px_-18px_rgba(18,32,67,0.22)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]" style={{ background: meta.soft, color: meta.accent }}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                      {t.bundle.title}
                    </span>
                  </div>
                  <h3 className="font-display text-[16px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                    {t.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] mt-auto" style={{ color: "var(--body)" }}>
                    {t.durationMinutes > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {t.durationMinutes} min
                      </span>
                    )}
                    {t.questionCount > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span style={{ color: "var(--line)" }}>·</span> {t.questionCount} questions
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold" style={{ color: "var(--brand)" }}>
                      Start <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-[2px]" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Other available packs */}
      {bundleSummary.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
            More practice packs
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
            {bundleSummary.map((b) => {
              const packTests = tests.filter((t) => t.bundle.id === b.id);
              const owned = packTests.some((t) => t.owned);
              return (
                <Link
                  key={b.id}
                  href={owned ? `/dashboard/mock-tests/${packTests.find((t) => t.owned)?.id}/take` : `/mock-tests/${b.id}`}
                  className="group rounded-[20px] border bg-white p-5 flex flex-col gap-3 transition-all duration-250 hover:-translate-y-[2px]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px] w-fit" style={{ background: "var(--bg-soft)", color: "var(--body)" }}>
                      {packTests.length} {packTests.length === 1 ? "test" : "tests"}
                    </span>
                    {b.price > 0 && !owned && (
                      <span className="ml-auto font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]" style={{ background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }}>
                        {formatPrice(b.price, b.currency)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-[16px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                    {b.title}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] mt-auto font-semibold" style={{ color: owned ? "var(--brand)" : "var(--body)" }}>
                    {owned ? (
                      <>
                        <CheckCircle2 size={14} /> Owned — start practice
                      </>
                    ) : (
                      <>
                        <Lock size={13} /> Browse &amp; buy pack
                      </>
                    )}
                    <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-[2px]" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Attempt history */}
      {attempts.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
            Attempt history
          </h2>
          <div className="rounded-[20px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
            <div className="divide-y" style={{ borderColor: "var(--line)" }}>
              {attempts.map((a) => {
                const meta = SKILL_META[a.skill as keyof typeof SKILL_META] ?? SKILL_META.reading;
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]" style={{ background: meta.soft, color: meta.accent }}>
                      {meta.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                        {a.title}
                      </p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                    {typeof a.band === "number" ? (
                      <span
                        className="shrink-0 flex items-center gap-1.5 font-display text-[17px] font-semibold"
                        style={{ color: "var(--brand)" }}
                      >
                        {a.band.toFixed(1)} <span className="text-[10px] font-mono uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>band</span>
                      </span>
                    ) : (
                      <span className="shrink-0 text-[12px]" style={{ color: "var(--body)" }}>
                        In progress
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Empty state */}
      {!loading && tests.length === 0 && attempts.length === 0 && (
        <div className="rounded-[20px] border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
          <p className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
            No mock tests available yet
          </p>
          <p className="text-[13.5px] mt-2" style={{ color: "var(--body)" }}>
            IELTS practice packs are coming soon — check the public page for updates.
          </p>
          <Link
            href="/mock-tests"
            className="inline-flex items-center gap-2 mt-6 rounded-full px-7 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            Browse mock tests <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

function bestBand(attempts: AttemptListItem[]): string {
  const bands = attempts
    .map((a) => a.band)
    .filter((b): b is number => typeof b === "number" && b > 0);
  if (bands.length === 0) return "—";
  return Math.max(...bands).toFixed(1);
}