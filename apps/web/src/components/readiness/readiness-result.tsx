"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Copy,
  Download,
  Gauge,
  GraduationCap,
  Languages,
  LoaderCircle,
  Lock,
  RotateCcw,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { generateReadinessPdf } from "@/lib/readiness/pdf";
import type {
  CategoryScore,
  ReadinessAnswers,
  ReadinessResult,
} from "@/lib/readiness/questions";

export const READINESS_STORAGE_KEY = "flybridge-readiness-result";

export type StoredReadiness = {
  result: ReadinessResult;
  report: string;
  answers: ReadinessAnswers;
  runId?: string;
};

export function makeRunId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function saveReadinessRun(
  answers: ReadinessAnswers,
  report: string,
  runId: string
): Promise<boolean> {
  return fetch("/api/me/readiness", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, answers, report }),
  })
    .then((res) => res.ok)
    .catch(() => false);
}

const CATEGORY_ICONS: Record<string, typeof GraduationCap> = {
  academic: GraduationCap,
  language: Languages,
  funding: Wallet,
  profile: Briefcase,
  planning: CalendarClock,
};

function scoreColor(score: number): string {
  if (score >= 80) return "#0FA968";
  if (score >= 60) return "#2F5FE0";
  if (score >= 40) return "#DB8A2E";
  return "#C0392B";
}

function scoreGlow(score: number): string {
  if (score >= 80) return "rgba(15,169,104,0.15)";
  if (score >= 60) return "rgba(47,95,224,0.15)";
  if (score >= 40) return "rgba(219,138,46,0.15)";
  return "rgba(192,57,43,0.15)";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderRich(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline font-medium" style="color:var(--brand-2)">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="px-[5px] py-[1px] rounded-[6px] font-mono text-[12px]" style="background:var(--bg-soft);color:var(--ink)">$1</code>')
    .replace(/^#{1,4}\s+(.+)$/gm, '<h3 class="font-display font-bold text-[15.5px] mt-7 mb-2.5 first:mt-0" style="color:var(--ink)">$1</h3>')
    .replace(/^- \[ \]\s+(.+)$/gm, '<div class="pl-2 flex gap-2.5 items-start"><span class="mt-[3px] w-[14px] h-[14px] rounded-[5px] border-[1.5px] shrink-0" style="border-color:var(--brand-2)"></span><span>$1</span></div>')
    .replace(/^- \[x\]\s+(.+)$/gm, '<div class="pl-2 flex gap-2.5 items-start"><span class="mt-[3px] w-[14px] h-[14px] rounded-[5px] shrink-0 flex items-center justify-center text-white" style="background:var(--brand)"><svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13L10 18L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>$1</span></div>')
    .replace(/^[-*]\s+(.+)$/gm, '<div class="pl-3 flex gap-2"><span style="color:var(--brand)">\u2022</span><span>$1</span></div>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function useCountUp(target: number, duration = 1400): number {
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

function ScoreRing({
  result,
  onDark = false,
}: {
  result: ReadinessResult;
  onDark?: boolean;
}) {
  const score = result.score;
  const display = useCountUp(score);
  const color = onDark ? "#FFFFFF" : scoreColor(score);
  const R = 82;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative w-[230px] h-[230px] mx-auto">
      <div
        className="absolute inset-[-22px] rounded-full opacity-70 blur-3xl"
        style={{ background: `radial-gradient(circle, ${onDark ? "rgba(255,255,255,0.12)" : scoreGlow(score)}, transparent 70%)` }}
      />
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          strokeWidth="11"
          style={{ stroke: onDark ? "rgba(255,255,255,0.15)" : "var(--bg-soft)" }}
        />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - score / 100)}
          style={{
            transition: "stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 16px ${onDark ? "rgba(255,255,255,0.3)" : color + "55"})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-[56px] font-bold leading-none tracking-[-0.04em]"
          style={{ color: onDark ? "#FFFFFF" : "var(--ink)" }}
        >
          {display}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em] mt-1.5"
          style={{ color: onDark ? "rgba(255,255,255,0.55)" : "var(--body)" }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}

function CategoryGrid({ categories }: { categories: CategoryScore[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c.id] ?? Gauge;
        const color = scoreColor(c.pct);
        return (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-[12px] border bg-white px-3.5 py-3"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: `${color}12` }}
            >
              <Icon size={15} style={{ color }} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {c.label}
                </span>
                <span className="font-mono text-[12px] font-bold shrink-0" style={{ color }}>
                  {c.pct}%
                </span>
              </div>
              <div className="mt-1.5 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${c.pct}%`,
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    transition: "width 1.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReadinessCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-[18px] opacity-70 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 200px at 20% 0%, rgba(15,169,104,0.10), transparent 60%), radial-gradient(600px 200px at 80% 100%, rgba(47,95,224,0.10), transparent 60%)",
        }}
      />
      <div
        className="relative rounded-[14px] border bg-white p-[clamp(18px,4vw,44px)]"
        style={{
          borderColor: "var(--line)",
          boxShadow: "0 32px 68px -28px rgba(18,32,67,0.16), 0 1px 3px rgba(18,32,67,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ReadinessResultView({
  result,
  report,
  generating,
  error,
  onRetake,
  showBanner = true,
}: {
  result: ReadinessResult;
  report: string;
  generating: boolean;
  error: string | null;
  onRetake: () => void;
  showBanner?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const copy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const download = async () => {
    if (!report || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await generateReadinessPdf(result, report);
    } catch (e) {
      console.error("readiness pdf download failed", e);
      setDownloadError(
        e instanceof Error ? e.message : "Couldn\u2019t generate the PDF. Try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fb-step-in">
      {showBanner && (
        <>
          {/* Report Header */}
          <div className="flex items-center justify-between gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border bg-white" style={{ borderColor: "var(--line)", boxShadow: "0 2px 8px rgba(18,32,67,0.06)" }}>
                <Image src="/transparent-logo-dark.png" alt="FlyBridge" width={24} height={24} className="object-contain" />
              </div>
              <div>
                <p className="font-display text-[14px] sm:text-[15px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
                  FlyBridge Education Group
                </p>
                <p className="font-mono text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.18em] mt-0.5" style={{ color: "var(--brand)" }}>
                  Study Abroad Readiness
                </p>
              </div>
            </div>
            <span className="hidden md:block font-mono text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
              {today}
            </span>
          </div>

          {/* Score Banner */}
          <div
            className="relative overflow-hidden rounded-[14px] px-[clamp(24px,4vw,40px)] pt-[clamp(32px,4vw,44px)] pb-[clamp(28px,4vw,40px)] text-center"
            style={{
              background: "linear-gradient(135deg, #071D14 0%, #0A3D2C 25%, #0FA968 55%, #2F5FE0 130%)",
              boxShadow: "0 28px 56px -20px rgba(15,169,104,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Decorative elements */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03), transparent 60%)" }} />

            <span
              className="relative inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] rounded-full px-5 py-[8px]"
              style={{ background: "rgba(255,255,255,0.14)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <BadgeCheck size={14} />
              {result.label}
            </span>

            <div className="relative mt-6">
              <ScoreRing result={result} onDark />
            </div>

            <p className="relative text-[14px] leading-[1.7] mt-6 max-w-[440px] mx-auto" style={{ color: "rgba(255,255,255,0.82)" }}>
              {result.tagline}
            </p>
          </div>
        </>
      )}

      {/* Category Breakdown */}
      <div className="rounded-[14px] border p-4 sm:p-5" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h4 className="font-display text-[14px] sm:text-[15px] font-bold" style={{ color: "var(--ink)" }}>
            Performance Breakdown
          </h4>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
            {result.score}/100 overall
          </span>
        </div>
        <CategoryGrid categories={result.categories} />
      </div>

      {/* Priority Focus Areas */}
      {result.priorityAreas.length > 0 && (
        <div className="mt-3 rounded-[14px] border p-4 sm:p-5" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
              style={{ background: "rgba(219,138,46,0.1)" }}
            >
              <Gauge size={14} style={{ color: "#DB8A2E" }} strokeWidth={2} />
            </span>
            <h4 className="font-display text-[14px] sm:text-[15px] font-bold" style={{ color: "var(--ink)" }}>
              Priority Focus Areas
            </h4>
            <p className="hidden sm:block text-[12px] ml-1" style={{ color: "var(--body)" }}>
              Hold your score back the most — start here.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {result.priorityAreas.map((p) => {
              const color = scoreColor(p.pct);
              return (
                <div
                  key={p.questionId}
                  className="flex items-center gap-3 rounded-[12px] border bg-white px-3.5 py-3"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                        {p.label}
                      </span>
                      <span className="font-mono text-[12px] font-bold shrink-0" style={{ color }}>
                        {p.pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.pct}%`,
                          background: `linear-gradient(90deg, ${color}cc, ${color})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Report */}
      <div className="mt-3 rounded-[14px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)", boxShadow: "0 4px 16px -6px rgba(18,32,67,0.08)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2.5">
            {generating ? (
              <LoaderCircle size={16} className="animate-spin" style={{ color: "var(--brand)" }} />
            ) : (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                style={{ background: "var(--brand-soft)" }}
              >
                <Sparkles size={14} style={{ color: "var(--brand)" }} strokeWidth={2} />
              </span>
            )}
            <h4 className="text-[14px] sm:text-[15px] font-bold" style={{ color: "var(--ink)" }}>
              Your Readiness Report
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              disabled={!report}
              className="flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3.5 py-[8px] transition-all duration-200 disabled:opacity-40 hover:bg-[var(--bg-soft)]"
              style={{ background: "var(--bg-soft)", color: "var(--ink)", border: "1px solid var(--line)" }}
            >
              <Copy size={13} /> {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={!report || downloading}
              className="flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3.5 py-[8px] text-white transition-all duration-250 disabled:opacity-40 hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #0FA968, #14B57E)",
                boxShadow: "0 4px 12px -4px rgba(15,169,104,0.4)",
              }}
            >
              {downloading ? (
                <LoaderCircle size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              {downloading ? "Preparing\u2026" : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-5 min-h-[180px]">
          {!report && generating && (
            <div className="flex flex-col gap-3 py-8">
              {[92, 100, 84, 96, 64].map((w, i) => (
                <div key={i} className="h-[13px] rounded-lg fb-shimmer" style={{ width: `${w}%` }} />
              ))}
              <p className="text-[12.5px] flex items-center gap-2.5 mt-3" style={{ color: "var(--body)" }}>
                <LoaderCircle size={14} className="animate-spin" style={{ color: "var(--brand)" }} />
                Writing your personalized report\u2026
              </p>
            </div>
          )}
          {report && (
            <div
              className="text-[14px] leading-[1.8] break-words whitespace-pre-wrap"
              style={{ color: "var(--ink)" }}
              dangerouslySetInnerHTML={{ __html: renderRich(report) }}
            />
          )}
          {!report && !generating && error && (
            <p className="text-[13px]" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}
        </div>
        {downloadError && (
          <p className="px-4 sm:px-5 pb-4 text-[12.5px]" style={{ color: "#C0392B" }}>
            {downloadError}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 mt-5 sm:mt-6">
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold px-7 py-[14px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #0FA968, #14B57E)",
            color: "#fff",
            boxShadow: "0 12px 28px -10px rgba(15,169,104,0.5)",
          }}
        >
          <RotateCcw size={15} />
          Retake assessment
        </button>
        <a
          href="/programs"
          className="inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold px-7 py-[14px] border-2 transition-all duration-250 hover:bg-[var(--bg-soft)]"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          Explore programs
          <ArrowRight size={15} />
        </a>
      </div>

      {/* Footer */}
      <div
        className="mt-5 rounded-[14px] border p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
      >
        <div className="flex items-center gap-3.5">
          <Image src="/transparent-logo-dark.png" alt="FlyBridge" width={36} height={36} className="object-contain shrink-0" />
          <div>
            <p className="font-display text-[14px] font-bold" style={{ color: "var(--ink)" }}>
              FlyBridge Education Group
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
              Study, work and build a career abroad — one confident step at a time.
            </p>
          </div>
        </div>
        <div className="text-[11.5px] text-center sm:text-right leading-relaxed font-medium" style={{ color: "var(--body)" }}>
          +1 778 676 8459
          <br />
          <span style={{ color: "var(--brand)" }}>flybridgeedu.com</span>
        </div>
      </div>

      <p className="text-center text-[11px] mt-6 font-medium" style={{ color: "#A6ADC0" }}>
        This score is an advisory estimate — official eligibility depends on each
        university and visa office.
      </p>
    </div>
  );
}

export function SignInGate({ onSignedIn }: { onSignedIn: () => void }) {
  const { signInWithGoogle, loading, error } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const email = await signInWithGoogle("readiness");
      if (email) onSignedIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fb-step-in text-center">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-[32px] blur-3xl opacity-50"
            style={{ background: "radial-gradient(circle, rgba(47,95,224,0.4), transparent 70%)" }}
          />
          <div
            className="relative w-[84px] h-[84px] rounded-[30px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2F5FE0, #4A74E8)",
              boxShadow: "0 22px 48px -12px rgba(47,95,224,0.55), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <Lock size={34} className="text-white fb-float" strokeWidth={1.7} />
          </div>
        </div>
      </div>

      <span
        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] rounded-full px-5 py-[8px]"
        style={{ background: "var(--brand-soft)", color: "var(--brand)", border: "1px solid rgba(15,169,104,0.12)" }}
      >
        <BadgeCheck size={14} /> Your score is ready
      </span>

      <h2 className="text-center font-display text-[22px] font-bold mt-5" style={{ color: "var(--ink)" }}>
        Sign in to see your result
      </h2>
      <p className="text-center text-[14px] leading-[1.7] mt-3 max-w-[440px] mx-auto" style={{ color: "var(--body)" }}>
        Your readiness score and personalized AI report are ready. Sign in with
        Google to view and download them.
      </p>

      <div className="flex flex-col items-center mt-8">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy || loading}
          className="flex items-center justify-center gap-2.5 rounded-2xl border-2 px-7 py-[13px] text-[14px] font-bold transition-all duration-250 hover:border-brand-2/60 hover:bg-brand-soft/50 hover:translate-y-[-1px] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ color: "var(--ink)", borderColor: "var(--line)", minWidth: 240 }}
        >
          {busy ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          {busy ? "Signing in\u2026" : "Continue with Google"}
        </button>
      </div>

      {error && (
        <p className="text-[12.5px] mt-3" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      <p className="text-center text-[13px] mt-6" style={{ color: "var(--body)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold hover:text-brand-2 transition-colors" style={{ color: "var(--brand)" }}>
          Log in
        </Link>
      </p>

      <p className="text-center text-[11px] mt-6 font-medium" style={{ color: "#A6ADC0" }}>
        Your answers and report stay private — nothing is posted publicly.
      </p>
    </div>
  );
}

export function ReadinessResultClient() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<StoredReadiness | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(READINESS_STORAGE_KEY);
      if (raw) setData(JSON.parse(raw) as StoredReadiness);
    } catch {
      // storage unavailable or malformed
    }
  }, []);

  useEffect(() => {
    if (loading || !user || !data || savedRef.current) return;
    savedRef.current = true;
    void saveReadinessRun(data.answers, data.report, data.runId ?? makeRunId());
  }, [loading, user, data]);

  const retake = () => {
    try {
      sessionStorage.removeItem(READINESS_STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.href = "/readiness";
  };

  return (
    <div className="w-full max-w-[860px] mx-auto px-4 sm:px-0">
      <div className="text-center mb-8 sm:mb-12">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.18em] rounded-full px-4 py-2"
          style={{ background: "var(--brand-soft)", color: "var(--brand)", border: "1px solid rgba(15,169,104,0.12)" }}
        >
          <Sparkles size={13} /> Your result
        </span>
        <h1
          className="font-display text-[clamp(30px,7vw,44px)] font-bold tracking-[-0.03em] mt-5 leading-[1.06]"
          style={{ color: "var(--ink)" }}
        >
          Your Readiness Report
        </h1>
        <p className="text-[14.5px] sm:text-[15px] leading-[1.7] mt-4 max-w-[520px] mx-auto" style={{ color: "var(--body)" }}>
          Your personalized score, category breakdown and AI action plan — all in
          one place.
        </p>
      </div>

      {loading ? (
        <ReadinessCard>
          <div className="py-16 flex flex-col items-center gap-5">
            <LoaderCircle size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-[14px] font-medium" style={{ color: "var(--body)" }}>
              Loading your result\u2026
            </p>
          </div>
        </ReadinessCard>
      ) : !data ? (
        <ReadinessCard>
          <div className="text-center py-10">
            <div
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-5"
              style={{ background: "var(--bg-soft)", border: "1px solid var(--line)" }}
            >
              <Gauge size={30} style={{ color: "#A6ADC0" }} strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-[20px] font-bold mt-2" style={{ color: "var(--ink)" }}>
              No result found
            </h2>
            <p className="text-[14px] mt-2.5 max-w-[400px] mx-auto leading-[1.7]" style={{ color: "var(--body)" }}>
              Complete the readiness assessment first to unlock your personalized
              score and AI report.
            </p>
            <Link
              href="/readiness"
              className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-bold px-8 py-[13px] mt-7 transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #0FA968, #14B57E)",
                boxShadow: "0 12px 28px -10px rgba(15,169,104,0.5)",
              }}
            >
              Take the assessment
              <ArrowRight size={15} />
            </Link>
          </div>
        </ReadinessCard>
      ) : !user ? (
        <ReadinessCard>
          <SignInGate onSignedIn={() => {}} />
        </ReadinessCard>
      ) : (
        <ReadinessCard>
          <ReadinessResultView
            result={data.result}
            report={data.report}
            generating={false}
            error={null}
            onRetake={retake}
          />
        </ReadinessCard>
      )}
    </div>
  );
}
