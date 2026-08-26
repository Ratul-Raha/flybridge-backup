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
  "Reading your answers…",
  "Reviewing your academic profile…",
  "Checking language readiness…",
  "Evaluating funding readiness…",
  "Assessing your timeline & goals…",
  "Preparing your personalized report…",
];

const CHIPS = [
  { label: "10 questions", icon: FileText },
  { label: "~3 minutes", icon: Compass },
  { label: "AI-powered report", icon: Sparkles },
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
    <div className="w-full max-w-[760px] mx-auto" ref={cardRef}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "var(--brand-soft)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
          <span className="font-mono text-[11px] font-medium tracking-[0.4px] uppercase" style={{ color: "var(--brand-2)" }}>
            Readiness Assessment
          </span>
        </div>
        <h1
          className="font-display font-semibold tracking-[-0.02em] text-balance leading-[1.1]"
          style={{ fontSize: "clamp(32px,4vw,48px)", color: "var(--ink)" }}
        >
          Study Abroad{" "}
          <span style={{ color: "var(--brand-2)" }}>Readiness Score</span>
        </h1>
        <p className="text-[15.5px] leading-[1.7] mt-4 max-w-[540px] mx-auto" style={{ color: "var(--body)" }}>
          Evaluate your preparedness across academics, language proficiency, financial readiness, and visa requirements — then receive a tailored action plan.
        </p>
      </div>

      <ReadinessCard>
          {phase === "intro" && (
            <div className="fb-step-in">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-[24px] blur-2xl opacity-40"
                    style={{ background: "radial-gradient(circle, rgba(15,169,104,0.35), transparent 70%)" }}
                  />
                  <div
                    className="relative w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #0FA968, #14B57E)",
                      boxShadow: "0 16px 36px -10px rgba(15,169,104,0.45)",
                    }}
                  >
                    <Compass size={32} className="text-white" strokeWidth={1.8} />
                  </div>
                </div>
              </div>

              <h2 className="text-center font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(18px,2.5vw,24px)", color: "var(--ink)" }}>
                How prepared are you for studying abroad?
              </h2>
              <p className="text-center text-[14px] leading-[1.7] mt-2.5 max-w-[440px] mx-auto" style={{ color: "var(--body)" }}>
                10 focused questions covering your academics, English proficiency, financial standing, and timeline. Results are instant.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
                {CHIPS.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-4 py-[8px]"
                    style={{ background: "var(--bg-soft)", color: "var(--body)", border: "1px solid var(--line)" }}
                  >
                    <c.icon size={13} style={{ color: "var(--brand)" }} />
                    {c.label}
                  </span>
                ))}
              </div>

              <div className="flex justify-center mt-7">
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex items-center gap-2 rounded-full text-white text-[15px] font-semibold px-9 py-[15px] transition-all duration-250 hover:translate-y-[-1px] hover:shadow-lg"
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
              <div className="flex items-center justify-between gap-4 mb-5">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
                  Question {step + 1} of {total}
                </span>
                <span
                  className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] rounded-full px-3.5 py-[6px]"
                  style={{ background: "var(--bg-soft)", color: "var(--brand-2)", border: "1px solid var(--line)" }}
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
                <div className="flex items-start gap-4 mb-7">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                  >
                    {(() => {
                      const Icon = QUESTION_ICONS[question.id];
                      return <Icon size={20} strokeWidth={1.9} />;
                    })()}
                  </span>
                  <div>
                    <h2 className="font-display text-[18px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                      {question.title}
                    </h2>
                    <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: "var(--body)" }}>
                      {question.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
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
                        className="group flex items-center justify-between gap-4 rounded-xl border bg-white px-5 py-[14px] text-left transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_28px_-14px_rgba(18,32,67,0.2)] disabled:opacity-80"
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
                            <span className="text-[12.5px]" style={{ color: "var(--body)" }}>
                              {option.hint}
                            </span>
                          )}
                        </span>
                        <span
                          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center border transition-all duration-200 ${
                            isMulti ? "rounded-[6px]" : "rounded-full"
                          }`}
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
                {isMulti ? (
                  <button
                    type="button"
                    onClick={continueNext}
                    disabled={advancing || multiSelected().length === 0}
                    className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--brand)" }}
                  >
                    Continue
                    <ArrowRight size={15} />
                  </button>
                ) : step < total - 1 ? (
                  <span className="text-[11.5px]" style={{ color: "#A6ADC0" }}>
                    Pick an answer to continue
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {phase === "thinking" && (
            <div className="py-10 flex flex-col items-center">
              <div className="relative w-[110px] h-[110px] mb-7">
                <div
                  className="absolute inset-0 rounded-full fb-spin-slow"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0%, #0FA968 18%, #14B57E 32%, transparent 55%, #2F5FE0 78%, transparent 100%)",
                    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 7px))",
                  }}
                />
                <div
                  className="absolute inset-[12px] rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <Gauge size={30} style={{ color: "var(--brand)" }} className="fb-pulse" strokeWidth={1.8} />
                </div>
              </div>

              <h3 className="font-display text-[18px] font-semibold text-center" style={{ color: "var(--ink)" }}>
                {THINKING_STEPS[thinkingIndex]}
              </h3>
              <p className="text-[13px] mt-2 text-center" style={{ color: "var(--body)" }}>
                Analyzing your profile — this typically takes 15–20 seconds.
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

          {phase === "gate" && (
            <SignInGate onSignedIn={() => router.push("/readiness/result")} />
          )}

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