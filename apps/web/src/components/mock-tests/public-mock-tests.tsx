"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Loader2, Sparkles } from "lucide-react";
import { SKILL_META, type BundleDto } from "@/lib/mock-test-ui";
import { formatPriceText } from "@/lib/pricing";

function SkillsRow({ skills }: { skills: BundleDto["skills"] }) {
  const entries = (Object.keys(skills) as (keyof typeof SKILL_META)[])
    .map((key) => ({ key, meta: SKILL_META[key], count: skills[key] ?? 0 }))
    .filter((e) => e.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.length === 0 && (
        <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
          Tests coming soon
        </span>
      )}
      {entries.map((e) => (
        <span
          key={e.key}
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-2.5 py-[4px]"
          style={{ background: e.meta.soft, color: e.meta.accent }}
        >
          {e.meta.label} {e.count}
        </span>
      ))}
    </div>
  );
}

export function PublicMockTests() {
  const [bundles, setBundles] = useState<BundleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mock-tests/bundles", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load mock tests (${res.status})`);
      const data = await res.json();
      setBundles(Array.isArray(data.bundles) ? data.bundles : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load mock tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const featured = useMemo(() => bundles.filter((b) => b.featured), [bundles]);
  const rest = useMemo(() => bundles.filter((b) => !b.featured), [bundles]);
  const ordered = [...featured, ...rest];

  return (
    <main>
      {/* Hero */}
      <section
        className="relative overflow-hidden px-[clamp(20px,4.5vw,56px)] pt-[clamp(120px,16vh,170px)] pb-16 text-center"
        style={{ background: "linear-gradient(180deg, rgba(111,76,224,0.08), rgba(47,95,224,0.03) 70%, transparent)" }}
      >
        <div className="w-full max-w-[860px] mx-auto">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] rounded-full px-4 py-[7px]"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Sparkles size={13} /> IELTS Practice
          </span>
          <h1
            className="font-display font-semibold tracking-[-0.02em] leading-[1.08] mt-5"
            style={{ fontSize: "clamp(32px,5vw,52px)", color: "var(--ink)" }}
          >
            Real IELTS mock tests.
            <br />
            Graded by AI.
          </h1>
          <p
            className="text-[15.5px] leading-[1.75] mt-5 max-w-[640px] mx-auto"
            style={{ color: "var(--body)" }}
          >
            Practice Reading, Listening, Writing and Speaking with full band-score
            feedback. Instant AI grading, real exam structure, and a score history
            that tracks your progress.
          </p>
        </div>
      </section>

      {/* Bundles */}
      <section className="px-[clamp(20px,4.5vw,56px)] pt-14 pb-[110px]">
        <div className="w-full max-w-[1320px] mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <h2
                className="font-display font-medium tracking-[-0.02em] leading-[1.1]"
                style={{ fontSize: "clamp(24px,2.6vw,32px)", color: "var(--ink)" }}
              >
                Choose your practice pack
              </h2>
              <p className="text-[14px] mt-[6px]" style={{ color: "var(--body)" }}>
                One-time purchase · lifetime access · unlimited attempts
              </p>
            </div>
            {!loading && (
              <span
                className="font-mono text-[10.5px] font-medium tracking-[0.25em] uppercase rounded-full px-3.5 py-[7px]"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                {ordered.length} {ordered.length === 1 ? "pack" : "packs"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
            </div>
          ) : error ? (
            <div className="rounded-xl border px-5 py-8 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
                {error}
              </p>
            </div>
          ) : ordered.length === 0 ? (
            <div className="rounded-xl border px-5 py-16 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
                No practice packs yet
              </p>
              <p className="text-[13.5px] mt-2" style={{ color: "var(--body)" }}>
                Mock tests are being prepared. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
              {ordered.map((b) => (
                <Link
                  key={b.id}
                  href={`/mock-tests/${b.id}`}
                  className="group flex flex-col overflow-hidden rounded-[24px] border bg-white transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
                  style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -14px rgba(18,32,67,0.1)" }}
                >
                  <div className="relative h-[150px] overflow-hidden">
                    {b.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.image}
                        alt={b.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#6B4CE0,#2F5FE0)" }}
                      >
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"
                          style={{ backdropFilter: "blur(2px)" }}
                        >
                          <BookOpen className="w-5 h-5 text-white" />
                        </span>
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(18,32,67,0.32), rgba(18,32,67,0.04) 50%)" }}
                    />
                    <span
                      className="absolute left-4 top-4 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-[11px] py-[5px]"
                      style={{ background: "rgba(255,255,255,0.92)", color: "#6B4CE0" }}
                    >
                      {b.badge || "IELTS"}
                    </span>
                    {formatPriceText(b) !== "Free" && (
                      <span
                        className="absolute right-4 top-4 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-[11px] py-[5px]"
                        style={{ background: "rgba(255,255,255,0.92)", color: "var(--ink)" }}
                      >
                        {formatPriceText(b)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 gap-3 p-5">
                    <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                      {b.title}
                    </h3>
                    {b.description && (
                      <p className="text-[13px] leading-[1.6] line-clamp-2 text-[var(--body)]">
                        {b.description}
                      </p>
                    )}

                    <SkillsRow skills={b.skills} />

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span
                        className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: "var(--brand-2)" }}
                      >
                        <Clock size={12} /> {b.testCount} {b.testCount === 1 ? "test" : "tests"}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-200 group-hover:gap-2.5"
                        style={{ color: "var(--brand)" }}
                      >
                        {b.price > 0 ? "Buy pack" : "Get free"} <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}