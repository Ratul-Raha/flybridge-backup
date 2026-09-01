"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Gauge,
  GraduationCap,
  MapPin,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { ReadinessResultView } from "@/components/readiness/readiness-result";
import { EmptyState, ScreenError } from "@/components/dashboard/user/ui";
import { countryByName } from "@/lib/countries";
import type { StoredReadinessRun } from "@/lib/models/readiness-run";
import type { CategoryScore } from "@/lib/readiness/questions";

const CATEGORY_ICONS: Record<string, typeof GraduationCap> = {
  academic: GraduationCap,
  language: Gauge,
  funding: Award,
  profile: Target,
  planning: TrendingUp,
};

function scoreColor(score: number): string {
  if (score >= 80) return "#0FA968";
  if (score >= 60) return "#2F5FE0";
  if (score >= 40) return "#DB8A2E";
  return "#C0392B";
}

const FLAG_FALLBACK: Record<string, string> = {
  Canada: "🇨🇦",
  USA: "🇺🇸",
  "United Kingdom": "🇬🇧",
  Europe: "🌍",
  "Open to any country": "🌐",
};

function countryFlag(label: string): string {
  if (FLAG_FALLBACK[label]) return FLAG_FALLBACK[label];
  return countryByName(label)?.flag ?? "🌍";
}

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[14px] border p-6 sm:p-8" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-6 w-40 rounded-lg fb-shimmer" />
          <div className="h-9 w-36 rounded-full fb-shimmer" />
        </div>
        <div className="mt-7 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="h-[72px] w-[160px] rounded-xl fb-shimmer" />
          <div className="flex-1 max-w-[400px] space-y-3">
            <div className="h-[10px] rounded-full fb-shimmer" />
            <div className="h-[10px] rounded-full fb-shimmer" style={{ width: "78%" }} />
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {[70, 120, 110].map((w, i) => (
            <div key={i} className="h-8 rounded-full fb-shimmer" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border p-5" style={{ borderColor: "var(--line)" }}>
            <div className="h-4 w-20 rounded-md fb-shimmer" />
            <div className="mt-3 h-7 w-24 rounded-lg fb-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadinessHero({ run, onRetake }: { run: StoredReadinessRun; onRetake: () => void }) {
  const score = run.result.score;
  const display = useCountUp(score);
  const color = scoreColor(score);
  const flag = countryFlag(run.country);
  const date = new Date(run.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="relative overflow-hidden rounded-[14px] text-white px-6 py-7 sm:px-8 sm:py-8"
      style={{
        background: "linear-gradient(135deg, #071D14 0%, #0A3D2C 30%, #0FA968 68%, #2F5FE0 135%)",
        boxShadow: "0 30px 60px -24px rgba(15,169,104,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {/* Decorations */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse at 20% 0%, black, transparent 60%)",
        }}
      />
      <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="pointer-events-none absolute -bottom-28 -left-10 h-80 w-80 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div
        className="pointer-events-none absolute right-[8%] top-[30%] hidden md:block h-36 w-36 rounded-full border"
        style={{ borderColor: "rgba(255,255,255,0.18)", boxShadow: "inset 0 0 40px rgba(255,255,255,0.05)" }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] rounded-full px-4 py-2"
          style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.16)" }}
        >
          <Sparkles size={12} />
          My readiness score
        </span>
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-[10px] text-[13px] font-bold text-[#0A3D2C] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_-8px_rgba(255,255,255,0.4)]"
        >
          <RotateCcw size={13} />
          Retake &amp; regenerate
        </button>
      </div>

      <div className="relative mt-7 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
        <div className="flex items-end gap-3 shrink-0">
          <span
            className="font-display text-[72px] sm:text-[88px] font-bold leading-none tracking-[-0.05em] transition-all duration-300"
            style={{ textShadow: `0 10px 40px ${color}66` }}
          >
            {display}
          </span>
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] mb-4 opacity-70">/ 100</span>
        </div>

        <div className="flex-1 max-w-[430px]">
          <div className="h-[10px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.16)" }}>
            <div
              className="h-full rounded-full transition-[width] duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: `${score}%`,
                background: "linear-gradient(90deg, #ffffff66, #ffffff)",
                boxShadow: "0 0 14px rgba(255,255,255,0.6)",
              }}
            />
          </div>
          <p
            className="mt-4 text-[14px] leading-[1.65]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {run.result.tagline}
          </p>
          <span
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold"
            style={{ color: "#FFFFFF" }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: color, boxShadow: `0 0 10px ${color}` }}
            />
            {run.result.label}
          </span>
        </div>
      </div>

      <div className="relative mt-7 flex flex-wrap items-center gap-2.5">
        {[
          { icon: MapPin, text: run.country || "Open to any country" },
          { icon: GraduationCap, text: run.degreeLevel || "Any degree level" },
          { icon: CalendarDays, text: date },
        ].map(({ icon: Icon, text }, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 rounded-full px-4 py-[9px] text-[12.5px] font-semibold"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)" }}
          >
            {i === 0 ? (
              <span className="text-[13px]">{flag}</span>
            ) : (
              <Icon size={13} style={{ color: "rgba(255,255,255,0.85)" }} />
            )}
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  color,
  pct,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint?: string;
  color: string;
  pct?: number;
}) {
  return (
    <div className="group flex flex-col rounded-xl border bg-white p-5 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_36px_-20px_rgba(18,32,67,0.3)]" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${color}14`, color }}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
          {label}
        </span>
      </div>
      <p className="font-display text-[20px] font-bold mt-3 leading-tight" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      {hint && (
        <p className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
          {hint}
        </p>
      )}
      {typeof pct === "number" && (
        <div className="mt-3 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}cc, ${color})`,
              boxShadow: `0 2px 8px ${color}33`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function DashboardReadiness() {
  const router = useRouter();
  const [run, setRun] = useState<StoredReadinessRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/me/readiness", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Couldn't load your readiness score");
        return res.json();
      })
      .then((data: { assessment?: StoredReadinessRun | null }) => {
        if (active) setRun(data.assessment ?? null);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const bestCategory = useMemo<CategoryScore | null>(() => {
    if (!run) return null;
    return [...run.result.categories].sort((a, b) => b.pct - a.pct)[0] ?? null;
  }, [run]);

  return (
    <div className="flex flex-col gap-5">
      {loading && <LoadingSkeleton />}

      {!loading && error && <ScreenError message={error} />}

      {!loading && !error && !run && (
        <EmptyState
          title="No readiness score yet"
          desc="Take the free assessment to get your personalized study abroad readiness score and AI action plan."
          action={
            <Link
              href="/readiness"
              className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              Take the assessment
              <ArrowRight size={15} />
            </Link>
          }
        />
      )}

      {!loading && !error && run && (
        <>
          <ReadinessHero run={run} onRetake={() => router.push("/readiness")} />

          <div className="grid sm:grid-cols-3 gap-4">
            <StatTile
              icon={Gauge}
              label="Overall score"
              value={`${run.result.score}/100`}
              hint={`${run.result.label} · stays valid across retakes`}
              color={scoreColor(run.result.score)}
              pct={run.result.score}
            />
            {bestCategory && (
              <StatTile
                icon={CATEGORY_ICONS[bestCategory.id] ?? Gauge}
                label="Strongest area"
                value={bestCategory.label}
                hint="Your best-performing dimension"
                color={scoreColor(bestCategory.pct)}
                pct={bestCategory.pct}
              />
            )}
            <StatTile
              icon={Target}
              label="Focus first"
              value={run.result.priorityAreas[0]?.label ?? "No gaps yet"}
              hint={
                run.result.priorityAreas[0]
                  ? "Biggest opportunity to raise your score"
                  : "You look ready — keep momentum"
              }
              color="#DB8A2E"
              pct={run.result.priorityAreas[0]?.pct ?? 100}
            />
          </div>

          {run.report ? (
            <ReadinessResultView
              result={run.result}
              report={run.report}
              generating={false}
              error={null}
              onRetake={() => router.push("/readiness")}
              showBanner={false}
            />
          ) : (
            <div
              className="rounded-[20px] border bg-white p-8 flex flex-col items-center text-center gap-2.5"
              style={{ borderColor: "var(--line)" }}
            >
              <Gauge size={34} style={{ color: "var(--brand)" }} strokeWidth={1.6} />
              <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                Your report text isn&apos;t available for this assessment
              </p>
              <p className="text-[13px] max-w-[420px]" style={{ color: "var(--body)" }}>
                Retake the assessment to generate a fresh, personalized AI report.
              </p>
              <button
                type="button"
                onClick={() => router.push("/readiness")}
                className="mt-3 inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-200 hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Retake assessment
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}