"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  Check,
  ChevronLeft,
  Compass,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  Languages,
  RotateCcw,
  School,
  Sparkles,
  Stamp,
  Target,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  READINESS_QUESTIONS,
  type ReadinessAnswers,
  type ReadinessQuestionId,
  type ReadinessResult,
} from "@/lib/readiness/questions";
import { useAuth } from "@/lib/auth/auth-context";
import {
  makeRunId,
  READINESS_STORAGE_KEY,
  ReadinessCard,
  ReadinessResultView,
  saveReadinessRun,
  SignInGate,
  type StoredReadiness,
} from "./readiness-result";

const QUESTION_ICONS: Record<ReadinessQuestionId, LucideIcon> = {
  education: GraduationCap,
  academics: FileText,
  english: Languages,
  finance: Wallet,
  experience: Briefcase,
  timeline: CalendarClock,
  goals: Target,
  visa: Stamp,
  targetCountry: Globe,
  degreeLevel: School,
};

const THINKING_STEPS = [
  "Reading your answers\u2026",
  "Reviewing your academic profile\u2026",
  "Checking language readiness\u2026",
  "Evaluating funding readiness\u2026",
  "Assessing your timeline & goals\u2026",
  "Preparing your personalized report\u2026",
];

const FEATURES = [
  { icon: FileText, label: "10 questions", desc: "Academics, finances, visa & more" },
  { icon: Compass, label: "~3 minutes", desc: "Quick, focused & mobile-friendly" },
  { icon: Zap, label: "AI action plan", desc: "Personalized & ready instantly" },
];

type Phase = "intro" | "quiz" | "thinking" | "gate" | "result";

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

  const { user } = useAuth();
  const router = useRouter();
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef(user);
  const answersRef = useRef(answers);
  const runIdRef = useRef<string | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!result || !report) return;
    if (!runIdRef.current) runIdRef.current = makeRunId();
    try {
      sessionStorage.setItem(
        READINESS_STORAGE_KEY,
        JSON.stringify({
          result,
          report,
          answers: answersRef.current,
          runId: runIdRef.current,
        } satisfies StoredReadiness)
      );
    } catch {
      // storage unavailable
    }
  }, [result, report]);

  const total = READINESS_QUESTIONS.length;
  const question = READINESS_QUESTIONS[step];
  const isMulti = question.multiSelect === true;

  const multiSelected = (): string[] =>
    Array.isArray(answers[question.id]) ? (answers[question.id] as string[]) : [];

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
    if (phase === "quiz" || phase === "thinking" || phase === "gate" || phase === "result") {
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

    if (isMulti) {
      const current = multiSelected();
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers((prev) => ({ ...prev, [question.id]: next }));
      return;
    }

    setPicked(value);
    setAdvancing(true);
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    advanceTimer.current = setTimeout(() => {
      if (step === total - 1) {
        setPhase("thinking");
        generate({ ...answersRef.current, [question.id]: value });
      } else {
        setStep((s) => s + 1);
      }
      setPicked(null);
      setAdvancing(false);
      advanceTimer.current = null;
    }, 480);
  };

  const continueNext = () => {
    if (advancing) return;
    if (isMulti && multiSelected().length === 0) return;
    setAdvancing(true);
    advanceTimer.current = setTimeout(() => {
      if (step === total - 1) {
        setPhase("thinking");
        generate(answersRef.current);
      } else {
        setStep((s) => s + 1);
      }
      setAdvancing(false);
      advanceTimer.current = null;
    }, 320);
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
    runIdRef.current = null;
    setAnswers({});
    setStep(0);
    setResult(null);
    setReport("");
    setError(null);
    setPhase("quiz");
  };

  const generate = useCallback(async (payload?: ReadinessAnswers) => {
    setResult(null);
    setReport("");
    setError(null);
    setGenerating(true);

    let finalResult: ReadinessResult | null = null;
    let finalReport = "";
    if (!runIdRef.current) runIdRef.current = makeRunId();

    try {
      const res = await fetch("/api/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload ?? answersRef.current }),
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
              finalResult = parsed.score;
              setResult(parsed.score);
              setPhase(userRef.current ? "result" : "gate");
            }
            if (parsed.text) {
              finalReport += parsed.text;
              setReport((prev) => prev + parsed.text);
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
      if (
        userRef.current &&
        finalResult &&
        runIdRef.current
      ) {
        void saveReadinessRun(answersRef.current, finalReport, runIdRef.current);
      }
    }
  }, []);

  const retry = () => {
    setPhase("thinking");
    generate();
  };

  const retake = () => {
    try {
      sessionStorage.removeItem(READINESS_STORAGE_KEY);
    } catch {
      // ignore
    }
    runIdRef.current = null;
    setAnswers({});
    setStep(0);
    setResult(null);
    setReport("");
    setError(null);
    setPicked(null);
    setPhase("intro");
  };

  return (
    <div className="w-full max-w-[860px] mx-auto px-4 sm:px-0" ref={cardRef}>
      {/* ── Page Header (mobile-optimized) ── */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 sm:mb-6" style={{ background: "var(--brand-soft)", border: "1px solid rgba(15,169,104,0.18)", boxShadow: "0 4px 12px -4px rgba(15,169,104,0.25)" }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "var(--brand)" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} />
          </span>
          <span className="font-mono text-[10.5px] sm:text-[11px] font-semibold tracking-[0.45px] uppercase" style={{ color: "var(--brand-2)" }}>
            Readiness Assessment
          </span>
        </div>

        <h1
          className="font-display font-bold tracking-[-0.03em] text-balance leading-[1.06]"
          style={{ fontSize: "clamp(30px,7vw,52px)", color: "var(--ink)" }}
        >
          Study Abroad{" "}
          <span
            className="relative inline-block"
            style={{
              background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Readiness Score
          </span>
        </h1>

        <p className="text-[15px] sm:text-[16px] leading-[1.7] mt-4 sm:mt-5 max-w-[560px] mx-auto" style={{ color: "var(--body)" }}>
          Evaluate your preparedness across academics, language, finances and visa — then get a tailored action plan.
        </p>
      </div>

      <ReadinessCard>
          {/* ─── INTRO ─── */}
          {phase === "intro" && (
            <div className="fb-step-in">
              {/* Compass hero */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-[28px] blur-3xl opacity-50"
                    style={{ background: "radial-gradient(circle, rgba(15,169,104,0.5), transparent 70%)" }}
                  />
                  <span
                    className="absolute -top-1 -right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white"
                    style={{ background: "linear-gradient(135deg, #2F5FE0, #4A74E8)", boxShadow: "0 6px 14px -4px rgba(47,95,224,0.5)" }}
                  >
                    <Sparkles size={13} strokeWidth={2.2} />
                  </span>
                  <div
                    className="relative w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-[26px] flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #0FA968, #14B57E)",
                      boxShadow: "0 20px 44px -10px rgba(15,169,104,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    <Compass size={32} className="text-white sm:hidden" strokeWidth={1.8} />
                    <Compass size={36} className="text-white hidden sm:block" strokeWidth={1.8} />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div className="text-center max-w-[560px] mx-auto">
                <h2 className="font-display font-bold tracking-[-0.01em] text-[21px] sm:text-[24px] leading-snug" style={{ color: "var(--ink)" }}>
                  How prepared are you for{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    studying abroad?
                  </span>
                </h2>
                <p className="text-center text-[14px] sm:text-[14.5px] leading-[1.7] mt-3" style={{ color: "var(--body)" }}>
                  Answer a few focused questions and get a personalized readiness score with an
                  instant action plan — built for students in minutes, on any device.
                </p>
              </div>

              {/* What we assess — feature grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-7">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.label}
                    className="relative flex flex-col items-center text-center gap-2 rounded-2xl px-3 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(18,32,67,0.2)]"
                    style={{ background: "var(--bg-soft)", border: "1px solid var(--line)" }}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        background: "linear-gradient(135deg, var(--brand-soft), rgba(20,181,126,0.08))",
                        border: "1px solid rgba(15,169,104,0.1)",
                      }}
                    >
                      <f.icon size={16} style={{ color: "var(--brand)" }} strokeWidth={2} />
                    </span>
                    <span className="text-[13px] font-bold leading-snug" style={{ color: "var(--ink)" }}>
                      {f.label}
                    </span>
                    <span className="text-[11.5px] leading-snug text-center" style={{ color: "var(--body)" }}>
                      {f.desc}
                    </span>
                    {i < FEATURES.length - 1 && (
                      <span
                        className="hidden sm:block absolute top-1/2 -right-[14px] -translate-y-1/2 h-6 w-px"
                        style={{ background: "radial-gradient(circle, var(--line), transparent 70%)" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={start}
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full text-white text-[15px] font-bold px-10 py-[16px] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0FA968, #14B57E)",
                    boxShadow: "0 16px 36px -10px rgba(15,169,104,0.55), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  Start assessment
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
                <span className="text-[12px] font-medium" style={{ color: "#8B93A7" }}>
                  Free \u2022 No account required to begin
                </span>
              </div>
            </div>
          )}

          {/* ─── QUIZ ─── */}
          {phase === "quiz" && (
            <div>
              {/* Top bar */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
                  Step {step + 1} / {total}
                </span>
                <span
                  className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] rounded-full px-3.5 py-[6px] truncate max-w-[150px]"
                  style={{ background: "var(--brand-soft)", color: "var(--brand-2)", border: "1px solid rgba(15,169,104,0.12)" }}
                >
                  {CATEGORY_LABELS[question.category]}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-[5px] rounded-full mb-3 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                <div
                  className="h-full rounded-full transition-all duration-600 ease-out"
                  style={{
                    width: `${((step + 1) / total) * 100}%`,
                    background: "linear-gradient(90deg, var(--brand), var(--brand-2))",
                    boxShadow: "0 0 12px rgba(15,169,104,0.35)",
                  }}
                />
              </div>

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-[6px] mb-7">
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
                      className="h-[6px] rounded-full transition-all duration-300"
                      style={{
                        width: current ? 28 : 6,
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

              {/* Question */}
              <div key={step} className="fb-step-in">
                <div className="flex items-start gap-3.5 sm:gap-4 mb-6 sm:mb-8">
                  <span
                    className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, var(--brand-soft), rgba(20,181,126,0.08))",
                      border: "1px solid rgba(15,169,104,0.12)",
                    }}
                  >
                    {(() => {
                      const Icon = QUESTION_ICONS[question.id];
                      return <Icon size={20} style={{ color: "var(--brand)" }} strokeWidth={1.9} />;
                    })()}
                  </span>
                  <div>
                    <h2 className="font-display text-[17px] sm:text-[19px] font-bold leading-snug" style={{ color: "var(--ink)" }}>
                      {question.title}
                    </h2>
                    <p className="text-[13px] sm:text-[13.5px] mt-1.5 leading-relaxed" style={{ color: "var(--body)" }}>
                      {question.subtitle}
                    </p>
                  </div>
                </div>

                {/* Options — bigger tap targets on mobile */}
                <div className="flex flex-col gap-2.5">
                  {question.options.map((option) => {
                    const active = isMulti
                      ? multiSelected().includes(option.value)
                      : picked === option.value || answers[question.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => pick(option.value)}
                        disabled={advancing}
                        className="group flex items-center justify-between gap-3.5 sm:gap-4 rounded-2xl border bg-white px-4 py-[15px] sm:px-5 sm:py-4 text-left transition-all duration-250 hover:translate-y-[-1px] hover:shadow-[0_14px_32px_-16px_rgba(18,32,67,0.18)] active:scale-[0.99] disabled:opacity-80"
                        style={{
                          borderColor: active ? "var(--brand)" : "var(--line)",
                          background: active ? "var(--brand-soft)" : "var(--bg)",
                          boxShadow: active ? "0 0 0 1.5px var(--brand), 0 8px 24px -12px rgba(15,169,104,0.2)" : "none",
                        }}
                      >
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[14px] sm:text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                            {option.label}
                          </span>
                          {option.hint && (
                            <span className="text-[12px] sm:text-[12.5px]" style={{ color: "var(--body)" }}>
                              {option.hint}
                            </span>
                          )}
                        </span>
                        <span
                          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center border-2 transition-all duration-200 ${
                            isMulti ? "rounded-lg" : "rounded-full"
                          }`}
                          style={{
                            borderColor: active ? "var(--brand)" : "var(--line)",
                            background: active ? "var(--brand)" : "transparent",
                          }}
                        >
                          {active && <Check size={12} className="text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation — full-width button on mobile */}
              <div className="flex items-center justify-between gap-3 mt-7 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-full px-3.5 py-[10px] transition-all duration-200 hover:bg-[var(--bg-soft)]"
                  style={{ color: "var(--body)" }}
                >
                  <ChevronLeft size={15} />
                  Back
                </button>
                {isMulti ? (
                  <button
                    type="button"
                    onClick={continueNext}
                    disabled={advancing || multiSelected().length === 0}
                    className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-bold px-6 py-[12px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #0FA968, #14B57E)",
                      boxShadow: "0 8px 20px -8px rgba(15,169,104,0.45)",
                    }}
                  >
                    Continue
                    <ArrowRight size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* ─── THINKING ─── */}
          {phase === "thinking" && (
            <div className="py-12 flex flex-col items-center px-2">
              <div className="relative w-[110px] h-[110px] sm:w-[120px] sm:h-[120px] mb-8">
                <div
                  className="absolute inset-0 rounded-full fb-spin-slow"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0%, #0FA968 18%, #14B57E 32%, transparent 55%, #2F5FE0 78%, transparent 100%)",
                    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
                  }}
                />
                <div
                  className="absolute inset-[14px] rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-soft)", border: "1px solid rgba(15,169,104,0.12)" }}
                >
                  <Gauge size={30} style={{ color: "var(--brand)" }} className="fb-pulse" strokeWidth={1.7} />
                </div>
              </div>

              <h3 className="font-display text-[18px] sm:text-[20px] font-bold text-center" style={{ color: "var(--ink)" }}>
                {THINKING_STEPS[thinkingIndex]}
              </h3>
              <p className="text-[13px] sm:text-[13.5px] mt-2.5 text-center" style={{ color: "var(--body)" }}>
                Analyzing your profile — this typically takes 15\u201320 seconds.
              </p>

              <div className="flex items-center gap-2 mt-7">
                {THINKING_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className="h-[5px] rounded-full transition-all duration-500"
                    style={{
                      width: i === thinkingIndex ? 24 : 5,
                      background: i <= thinkingIndex ? "var(--brand)" : "var(--line)",
                      boxShadow: i === thinkingIndex ? "0 0 8px rgba(15,169,104,0.3)" : "none",
                    }}
                  />
                ))}
              </div>

              {error && (
                <div className="mt-10 w-full max-w-[420px]">
                  <div
                    className="text-[13px] rounded-2xl border px-5 py-4 text-center"
                    style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.2)", background: "rgba(192,57,43,0.04)" }}
                  >
                    {error}
                  </div>
                  <div className="flex justify-center mt-5">
                    <button
                      type="button"
                      onClick={retry}
                      className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-bold px-7 py-[12px] transition-all duration-250 hover:opacity-90"
                      style={{
                        background: "linear-gradient(135deg, #0FA968, #14B57E)",
                        boxShadow: "0 8px 20px -8px rgba(15,169,104,0.45)",
                      }}
                    >
                      <RotateCcw size={14} />
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── GATE ─── */}
          {phase === "gate" && (
            <SignInGate onSignedIn={() => router.push("/readiness/result")} />
          )}

          {/* ─── RESULT ─── */}
          {phase === "result" && result && (
            <ReadinessResultView
              result={result}
              report={report}
              generating={generating}
              error={error}
              onRetake={retake}
            />
          )}
        </ReadinessCard>
    </div>
  );
}
