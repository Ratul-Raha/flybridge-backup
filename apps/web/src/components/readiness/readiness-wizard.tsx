"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Check,
  ChevronLeft,
  Compass,
  Copy,
  Download,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  Languages,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  READINESS_QUESTIONS,
  type CategoryScore,
  type ReadinessAnswers,
  type ReadinessQuestionId,
  type ReadinessResult,
} from "@/lib/readiness/questions";

const QUESTION_ICONS: Record<ReadinessQuestionId, LucideIcon> = {
  education: GraduationCap,
  academics: FileText,
  english: Languages,
  finance: Wallet,
  experience: Briefcase,
  timeline: CalendarClock,
  goals: Target,
  targetCountry: Globe,
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
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

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

function ScoreRing({ result }: { result: ReadinessResult }) {
  const score = result.score;
  const display = useCountUp(score);
  const color = scoreColor(score);
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
          style={{ stroke: "var(--bg-soft)" }}
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
          style={{ color: "var(--ink)" }}
        >
          {display}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: "var(--body)" }}>
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

const THINKING_STEPS = [
  "Reading your answers…",
  "Reviewing your academic profile…",
  "Checking language readiness…",
  "Evaluating funding readiness…",
  "Assessing your timeline & goals…",
  "Preparing your personalized report…",
];

const CHIPS = [
  { label: "8 questions", icon: FileText },
  { label: "~2 minutes", icon: Compass },
  { label: "AI-powered report", icon: Sparkles },
];

type Phase = "intro" | "quiz" | "thinking" | "result";

export function ReadinessWizard() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ReadinessAnswers>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [report, setReport] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const total = READINESS_QUESTIONS.length;
  const question = READINESS_QUESTIONS[step];

  useEffect(() => {
    if (phase === "thinking") {
      setThinkingIndex(0);
      const id = setInterval(() => {
        setThinkingIndex((i) => (i + 1) % THINKING_STEPS.length);
      }, 1700);
      return () => clearInterval(id);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "quiz" || phase === "thinking" || phase === "result") {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  const clearAdvance = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setAdvancing(false);
  };

  const pick = (value: string) => {
    if (advancing) return;
    setPicked(value);
    setAdvancing(true);
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    advanceTimer.current = setTimeout(() => {
      if (step === total - 1) {
        setPhase("thinking");
        generate();
      } else {
        setStep((s) => s + 1);
      }
      setPicked(null);
      setAdvancing(false);
      advanceTimer.current = null;
    }, 480);
  };

  const back = () => {
    clearAdvance();
    if (step === 0) {
      setPhase("intro");
    } else {
      setStep((s) => s - 1);
    }
  };

  const start = () => {
    setAnswers({});
    setStep(0);
    setResult(null);
    setReport("");
    setError(null);
    setPhase("quiz");
  };

  const generate = useCallback(async () => {
    setResult(null);
    setReport("");
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        let detail = "Something went wrong";
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) detail = data.error;
        } catch {
          // keep default
        }
        throw new Error(detail);
      }

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const parsed = JSON.parse(line.slice(6)) as {
              score?: ReadinessResult;
              text?: string;
            };
            if (parsed.score) {
              setResult(parsed.score);
              setPhase("result");
            }
            if (parsed.text) {
              setReport((prev) => prev + parsed.text);
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }, [answers]);

  const retry = () => {
    setPhase("thinking");
    generate();
  };

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

  const download = () => {
    if (!report) return;
    downloadText(
      `FlyBridge Study Abroad Readiness Report\n\nScore: ${result?.score ?? 0}/100 (${result?.label ?? ""})\n\n${report}`,
      "flybridge-readiness-report.txt"
    );
  };

  const retake = () => {
    setAnswers({});
    setStep(0);
    setResult(null);
    setReport("");
    setError(null);
    setPicked(null);
    setPhase("intro");
  };

  return (
    <div className="w-full max-w-[760px] mx-auto" ref={cardRef}>
      <div className="text-center mb-10">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] rounded-full px-4 py-[7px]"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <Sparkles size={12} /> Free AI assessment
        </span>
        <h1
          className="font-display text-[clamp(28px,4.6vw,42px)] font-semibold tracking-[-0.03em] mt-4 leading-[1.08]"
          style={{ color: "var(--ink)" }}
        >
          Study Abroad Readiness Score
        </h1>
        <p className="text-[14.5px] leading-[1.7] mt-3 max-w-[520px] mx-auto" style={{ color: "var(--body)" }}>
          Answer a few simple questions and get your personalized readiness score —
          plus a step-by-step action plan built by AI.
        </p>
      </div>

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
          {phase === "intro" && (
            <div className="fb-step-in">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-[28px] blur-2xl opacity-50"
                    style={{ background: "radial-gradient(circle, rgba(15,169,104,0.35), transparent 70%)" }}
                  />
                  <div
                    className="relative w-[84px] h-[84px] rounded-[28px] flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #0FA968, #14B57E)",
                      boxShadow: "0 18px 40px -12px rgba(15,169,104,0.5)",
                    }}
                  >
                    <Compass size={36} className="text-white fb-float" strokeWidth={1.8} />
                  </div>
                </div>
              </div>

              <h2 className="text-center font-display text-[20px] font-semibold" style={{ color: "var(--ink)" }}>
                How ready are you to study abroad?
              </h2>
              <p className="text-center text-[13.5px] leading-[1.7] mt-2 max-w-[420px] mx-auto" style={{ color: "var(--body)" }}>
                Answer 8 quick questions about your academics, English, funding and
                plans. We&apos;ll score your readiness and give you a tailored report
                with clear next steps.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
                {CHIPS.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium rounded-full px-3.5 py-[7px]"
                    style={{ background: "var(--bg-soft)", color: "var(--body)" }}
                  >
                    <c.icon size={12} style={{ color: "var(--brand)" }} />
                    {c.label}
                  </span>
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex items-center gap-2 rounded-full text-white text-[14.5px] font-semibold px-8 py-[14px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 hover:shadow-lg"
                  style={{ background: "var(--brand)", boxShadow: "0 14px 30px -12px rgba(15,169,104,0.45)" }}
                >
                  Start assessment
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {phase === "quiz" && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--body)" }}>
                  Question {step + 1} of {total}
                </span>
                <span
                  className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] rounded-full px-3.5 py-[6px]"
                  style={{ background: "var(--bg-soft)", color: "var(--brand-2)" }}
                >
                  {CATEGORY_LABELS[question.category]}
                </span>
              </div>

              <div className="h-[6px] rounded-full mb-4 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${((step + 1) / total) * 100}%`,
                    background: "linear-gradient(90deg, var(--brand), var(--brand-2))",
                  }}
                />
              </div>

              <div className="flex items-center justify-center gap-[7px] mb-8">
                {READINESS_QUESTIONS.map((q, i) => {
                  const answered = answers[q.id] !== undefined;
                  const current = i === step;
                  const reachable = i < step && answered;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => reachable && setStep(i)}
                      aria-label={`Question ${i + 1}`}
                      className="h-[7px] rounded-full transition-all duration-300"
                      style={{
                        width: current ? 26 : 7,
                        background: current
                          ? "var(--brand)"
                          : answered
                            ? "var(--brand-2)"
                            : "var(--line)",
                        cursor: reachable ? "pointer" : "default",
                        boxShadow: current ? "0 0 0 3px var(--brand-soft)" : "none",
                      }}
                    />
                  );
                })}
              </div>

              <div key={step} className="fb-step-in">
                <div className="flex items-start gap-3.5 mb-7">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                  >
                    {(() => {
                      const Icon = QUESTION_ICONS[question.id];
                      return <Icon size={20} strokeWidth={1.9} />;
                    })()}
                  </span>
                  <div>
                    <h2 className="font-display text-[19px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                      {question.title}
                    </h2>
                    <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
                      {question.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {question.options.map((option) => {
                    const active = picked === option.value || answers[question.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => pick(option.value)}
                        disabled={advancing}
                        className="group flex items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-[15px] text-left transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_28px_-14px_rgba(18,32,67,0.25)] disabled:opacity-80"
                        style={{
                          borderColor: active ? "var(--brand)" : "var(--line)",
                          background: active ? "var(--brand-soft)" : "var(--bg)",
                          boxShadow: active ? "0 0 0 1px var(--brand)" : "none",
                        }}
                      >
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                            {option.label}
                          </span>
                          {option.hint && (
                            <span className="text-[12px]" style={{ color: "var(--body)" }}>
                              {option.hint}
                            </span>
                          )}
                        </span>
                        <span
                          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-all duration-200"
                          style={{
                            borderColor: active ? "var(--brand)" : "var(--line)",
                            background: active ? "var(--brand)" : "transparent",
                          }}
                        >
                          {active && <Check size={13} className="text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full px-4 py-[9px] transition-colors duration-200 hover:opacity-75"
                  style={{ color: "var(--body)" }}
                >
                  <ChevronLeft size={15} />
                  Back
                </button>
                {step < total - 1 && (
                  <span className="text-[11.5px]" style={{ color: "#A6ADC0" }}>
                    Pick an answer to continue
                  </span>
                )}
              </div>
            </div>
          )}

          {phase === "thinking" && (
            <div className="py-10 flex flex-col items-center">
              <div className="relative w-[120px] h-[120px] mb-8">
                <div
                  className="absolute inset-0 rounded-full fb-spin-slow"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0%, #0FA968 18%, #14B57E 32%, transparent 55%, #2F5FE0 78%, transparent 100%)",
                    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px))",
                  }}
                />
                <div
                  className="absolute inset-[14px] rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <Gauge size={34} style={{ color: "var(--brand)" }} className="fb-pulse" strokeWidth={1.8} />
                </div>
              </div>

              <h3 className="font-display text-[17px] font-semibold text-center" style={{ color: "var(--ink)" }}>
                {THINKING_STEPS[thinkingIndex]}
              </h3>
              <p className="text-[12.5px] mt-2 text-center" style={{ color: "var(--body)" }}>
                Scoring your profile and writing your report — usually 15–20 seconds.
              </p>

              <div className="flex items-center gap-2 mt-6">
                {THINKING_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className="h-[5px] rounded-full transition-all duration-500"
                    style={{
                      width: i === thinkingIndex ? 22 : 5,
                      background: i <= thinkingIndex ? "var(--brand)" : "var(--line)",
                    }}
                  />
                ))}
              </div>

              {error && (
                <div className="mt-8 w-full max-w-[400px]">
                  <div
                    className="text-[13px] rounded-xl border px-4 py-3 text-center"
                    style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}
                  >
                    {error}
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={retry}
                      className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-200 hover:opacity-90"
                      style={{ background: "var(--brand)" }}
                    >
                      <RotateCcw size={14} />
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === "result" && result && (
            <div className="fb-step-in">
              <div className="text-center">
                <span
                  className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] rounded-full px-4 py-[7px]"
                  style={{ background: "var(--bg-soft)", color: scoreColor(result.score) }}
                >
                  <BadgeCheck size={13} />
                  {result.label}
                </span>

                <div className="mt-6">
                  <ScoreRing result={result} />
                </div>

                <p className="text-[13.5px] leading-[1.65] mt-5 max-w-[440px] mx-auto" style={{ color: "var(--body)" }}>
                  {result.tagline}
                </p>
              </div>

              <div className="mt-8 rounded-[20px] border p-6" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                <h4 className="font-display text-[14px] font-semibold mb-5" style={{ color: "var(--ink)" }}>
                  How you scored by area
                </h4>
                <CategoryBars categories={result.categories} />
              </div>

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
                      disabled={!report}
                      className="flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3.5 py-[7px] text-white transition-colors duration-200 disabled:opacity-40"
                      style={{ background: "var(--brand)" }}
                    >
                      <Download size={13} /> .txt
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
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={retake}
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

              <p className="text-center text-[11px] mt-6" style={{ color: "#A6ADC0" }}>
                This score is an advisory estimate — official eligibility depends on each
                university and visa office.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}