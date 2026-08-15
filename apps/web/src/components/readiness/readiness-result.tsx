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
    .replace(/^#{1,4}\s+(.+)$/gm, '<h3 class="font-display font-semibold text-[15.5px] mt-6 mb-2 first:mt-0" style="color:var(--ink)">$1</h3>')
    .replace(/^[-*]\s+(.+)$/gm, '<div class="pl-3 flex gap-2"><span style="color:var(--brand)">•</span><span>$1</span></div>')
    .replace(/^- \[ \]\s+(.+)$/gm, '<div class="pl-2 flex gap-2.5 items-start"><span class="mt-[3px] w-[13px] h-[13px] rounded-[4px] border shrink-0" style="border-color:var(--brand-2)"></span><span>$1</span></div>')
    .replace(/^- \[x\]\s+(.+)$/gm, '<div class="pl-2 flex gap-2.5 items-start"><span class="mt-[3px] w-[13px] h-[13px] rounded-[4px] shrink-0 flex items-center justify-center text-white" style="background:var(--brand)"><svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13L10 18L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>$1</span></div>')
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
    <div className="relative w-[220px] h-[220px] mx-auto">
      <div
        className="absolute inset-[-18px] rounded-full opacity-60 blur-2xl"
        style={{ background: `radial-gradient(circle, ${color}33, transparent 70%)` }}
      />
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          strokeWidth="12"
          style={{ stroke: onDark ? "rgba(255,255,255,0.18)" : "var(--bg-soft)" }}
        />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - score / 100)}
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 14px ${color}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-[52px] font-bold leading-none tracking-[-0.04em]"
          style={{ color: onDark ? "#FFFFFF" : "var(--ink)" }}
        >
          {display}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.2em] mt-1"
          style={{ color: onDark ? "rgba(255,255,255,0.65)" : "var(--body)" }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}

function CategoryBars({ categories }: { categories: CategoryScore[] }) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c.id] ?? Gauge;
        const color = scoreColor(c.pct);
        return (
          <div key={c.id}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                <Icon size={13} style={{ color }} />
                {c.label}
              </span>
              <span className="font-mono text-[11.5px] font-semibold" style={{ color }}>
                {c.pct}%
              </span>
            </div>
            <div
              className="h-[7px] rounded-full overflow-hidden"
              style={{ background: "var(--bg-soft)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${c.pct}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
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
        className="absolute inset-0 rounded-[32px] opacity-70 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 200px at 20% 0%, rgba(15,169,104,0.10), transparent 60%), radial-gradient(600px 200px at 80% 100%, rgba(47,95,224,0.10), transparent 60%)",
        }}
      />
      <div
        className="relative rounded-[28px] border bg-white p-[clamp(22px,4vw,40px)]"
        style={{ borderColor: "var(--line)", boxShadow: "0 24px 60px -24px rgba(18,32,67,0.18)" }}
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
}: {
  result: ReadinessResult;
  report: string;
  generating: boolean;
  error: string | null;
  onRetake: () => void;
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
        e instanceof Error ? e.message : "Couldn't generate the PDF. Try again."
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
      <div className="flex items-center justify-between gap-4 mb-8 pb-6 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white" style={{ borderColor: "var(--line)" }}>
            <Image src="/logo.png" alt="FlyBridge" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <p className="font-display text-[14px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
              FlyBridge Education Group
            </p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em]" style={{ color: "var(--brand)" }}>
              Study Abroad Readiness
            </p>
          </div>
        </div>
        <span className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
          {today}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-[26px] px-[clamp(20px,4vw,36px)] pt-[clamp(28px,4vw,40px)] pb-[clamp(24px,4vw,36px)] text-center"
        style={{
          background: "linear-gradient(135deg, #0A3D2C 0%, #0FA968 52%, #2F5FE0 130%)",
          boxShadow: "0 24px 50px -20px rgba(15,169,104,0.45)",
        }}
      >
        <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />

        <span
          className="relative inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] rounded-full px-4 py-[7px]"
          style={{ background: "rgba(255,255,255,0.16)", color: "#FFFFFF" }}
        >
          <BadgeCheck size={13} />
          {result.label}
        </span>

        <div className="relative mt-5">
          <ScoreRing result={result} onDark />
        </div>

        <p className="relative text-[13.5px] leading-[1.7] mt-5 max-w-[440px] mx-auto" style={{ color: "rgba(255,255,255,0.85)" }}>
          {result.tagline}
        </p>
      </div>

      <div className="mt-6 rounded-[20px] border p-6" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-display text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            How you scored by area
          </h4>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
            {result.score}/100 overall
          </span>
        </div>
        <CategoryBars categories={result.categories} />
      </div>

      {result.priorityAreas.length > 0 && (
        <div className="mt-6 rounded-[20px] border p-6" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
          <h4 className="font-display text-[14px] font-semibold mb-1" style={{ color: "var(--ink)" }}>
            Priority focus areas
          </h4>
          <p className="text-[12.5px] mb-4" style={{ color: "var(--body)" }}>
            These are the dimensions holding your score back the most — start here.
          </p>
          <div className="flex flex-col gap-3">
            {result.priorityAreas.map((p) => {
              const color = scoreColor(p.pct);
              return (
                <div key={p.questionId}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                      {p.label}
                    </span>
                    <span className="font-mono text-[11.5px] font-semibold" style={{ color }}>
                      {p.pct}%
                    </span>
                  </div>
                  <div className="h-[7px] rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.pct}%`,
                        background: `linear-gradient(90deg, ${color}88, ${color})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-[20px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            {generating ? (
              <LoaderCircle size={14} className="animate-spin" style={{ color: "var(--brand)" }} />
            ) : (
              <Sparkles size={14} style={{ color: "var(--brand)" }} />
            )}
            <h4 className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
              Your readiness report
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              disabled={!report}
              className="flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3.5 py-[7px] transition-colors duration-200 disabled:opacity-40"
              style={{ background: "var(--bg-soft)", color: "var(--ink)" }}
            >
              <Copy size={13} /> {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={!report || downloading}
              className="flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3.5 py-[7px] text-white transition-colors duration-200 disabled:opacity-40"
              style={{ background: "var(--brand)" }}
            >
              {downloading ? (
                <LoaderCircle size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="px-5 py-4 min-h-[160px]">
          {!report && generating && (
            <div className="flex flex-col gap-2.5 py-6">
              {[92, 100, 84, 96, 64].map((w, i) => (
                <div key={i} className="h-[12px] rounded-md fb-shimmer" style={{ width: `${w}%` }} />
              ))}
              <p className="text-[12px] flex items-center gap-2 mt-2" style={{ color: "var(--body)" }}>
                <LoaderCircle size={13} className="animate-spin" style={{ color: "var(--brand)" }} />
                Writing your personalized report…
              </p>
            </div>
          )}
          {report && (
            <div
              className="text-[13.5px] leading-[1.75] break-words whitespace-pre-wrap"
              style={{ color: "var(--ink)" }}
              dangerouslySetInnerHTML={{ __html: renderRich(report) }}
            />
          )}
          {!report && !generating && error && (
            <p className="text-[12.5px]" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}
        </div>
        {downloadError && (
          <p className="px-5 pb-4 text-[12px]" style={{ color: "#C0392B" }}>
            {downloadError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center gap-2 rounded-full text-[13.5px] font-semibold px-6 py-[12px] transition-all duration-200 hover:opacity-85"
          style={{ background: "var(--brand)", color: "#fff", boxShadow: "0 10px 24px -12px rgba(15,169,104,0.5)" }}
        >
          <RotateCcw size={14} />
          Retake assessment
        </button>
        <a
          href="/programs"
          className="inline-flex items-center gap-2 rounded-full text-[13.5px] font-semibold px-6 py-[12px] border transition-all duration-200 hover:bg-[var(--bg-soft)]"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          Explore programs
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="mt-6 rounded-[20px] border p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="FlyBridge" width={34} height={34} className="object-contain" />
          <div>
            <p className="font-display text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
              FlyBridge Education Group
            </p>
            <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
              Study, work and build a career abroad — one confident step at a time.
            </p>
          </div>
        </div>
        <div className="text-[11px] text-center sm:text-right leading-relaxed" style={{ color: "var(--body)" }}>
          +1 778 676 8459
          <br />
          <span style={{ color: "var(--brand)" }}>flybridgeedu.com</span>
        </div>
      </div>

      <p className="text-center text-[11px] mt-5" style={{ color: "#A6ADC0" }}>
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
      const email = await signInWithGoogle();
      if (email) onSignedIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fb-step-in text-center">
      <div className="flex justify-center mb-7">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-[28px] blur-2xl opacity-50"
            style={{ background: "radial-gradient(circle, rgba(47,95,224,0.35), transparent 70%)" }}
          />
          <div
            className="relative w-[76px] h-[76px] rounded-[28px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2F5FE0, #4A74E8)",
              boxShadow: "0 18px 40px -12px rgba(47,95,224,0.5)",
            }}
          >
            <Lock size={30} className="text-white fb-float" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <span
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] rounded-full px-4 py-[7px]"
        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
      >
        <BadgeCheck size={13} /> Your score is ready
      </span>

      <h2 className="text-center font-display text-[20px] font-semibold mt-4" style={{ color: "var(--ink)" }}>
        Sign in to see your result
      </h2>
      <p className="text-center text-[13.5px] leading-[1.7] mt-2 max-w-[420px] mx-auto" style={{ color: "var(--body)" }}>
        Your readiness score and personalized AI report are ready. Sign in with
        Google to view and download them.
      </p>

      <div className="flex flex-col items-center mt-7">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy || loading}
          className="flex items-center justify-center gap-2.5 rounded-xl border px-6 py-[12px] text-[13.5px] font-semibold transition-all duration-200 hover:border-brand-2/60 hover:bg-brand-soft/50 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ color: "var(--ink)", borderColor: "var(--line)", minWidth: 230 }}
        >
          {busy ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          {busy ? "Signing in…" : "Continue with Google"}
        </button>
      </div>

      {error && (
        <p className="text-[12px] mt-3" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      <p className="text-center text-[12.5px] mt-5" style={{ color: "var(--body)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium hover:text-brand-2 transition-colors" style={{ color: "var(--brand)" }}>
          Log in
        </Link>
      </p>

      <p className="text-center text-[11px] mt-6" style={{ color: "#A6ADC0" }}>
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
    <div className="w-full max-w-[760px] mx-auto">
      <div className="text-center mb-10">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] rounded-full px-4 py-[7px]"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <Sparkles size={12} /> Your result
        </span>
        <h1
          className="font-display text-[clamp(28px,4.6vw,42px)] font-semibold tracking-[-0.03em] mt-4 leading-[1.08]"
          style={{ color: "var(--ink)" }}
        >
          Your Readiness Report
        </h1>
        <p className="text-[14.5px] leading-[1.7] mt-3 max-w-[520px] mx-auto" style={{ color: "var(--body)" }}>
          Your personalized score, category breakdown and AI action plan — all in
          one place.
        </p>
      </div>

      {loading ? (
        <ReadinessCard>
          <div className="py-14 flex flex-col items-center gap-4">
            <LoaderCircle size={28} className="animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-[13px]" style={{ color: "var(--body)" }}>
              Loading your result…
            </p>
          </div>
        </ReadinessCard>
      ) : !data ? (
        <ReadinessCard>
          <div className="text-center py-8">
            <Gauge size={40} style={{ color: "#A6ADC0" }} strokeWidth={1.5} />
            <h2 className="font-display text-[18px] font-semibold mt-5" style={{ color: "var(--ink)" }}>
              No result found
            </h2>
            <p className="text-[13.5px] mt-2 max-w-[380px] mx-auto leading-[1.7]" style={{ color: "var(--body)" }}>
              Complete the readiness assessment first to unlock your personalized
              score and AI report.
            </p>
            <Link
              href="/readiness"
              className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-semibold px-7 py-[12px] mt-6 transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
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