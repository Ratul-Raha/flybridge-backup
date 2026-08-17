"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle, AlertTriangle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Question = {
  id: string;
  type: "mcq" | "true-false" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type Result = {
  questionId: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
};

type Phase = "idle" | "loading" | "taking" | "submitting" | "results";

type ResultsData = {
  score: number;
  totalQuestions: number;
  correctCount: number;
  results: Result[];
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LessonQuiz({
  courseId,
  moduleIndex,
  lessonIndex,
  onScoreUpdate,
}: {
  courseId: string;
  moduleIndex: number;
  lessonIndex: number;
  onScoreUpdate?: (entry: { moduleIndex: number; lessonIndex: number; score: number; correctCount: number; totalQuestions: number }) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ResultsData | null>(null);
  const [error, setError] = useState("");
  const [showRetakeWarning, setShowRetakeWarning] = useState(false);

  const startQuiz = async () => {
    setPhase("loading");
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIndex, lessonIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to load quiz");
      setQuestions(data.questions);
      setAnswers({});
      setPhase("taking");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("idle");
    }
  };

  const submitQuiz = async () => {
    setPhase("submitting");
    setError("");
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      const res = await fetch(`/api/courses/${courseId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleIndex,
          lessonIndex,
          questions,
          answers: answerArray,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit quiz");
      setResults(data);
      setPhase("results");
      onScoreUpdate?.({ moduleIndex, lessonIndex, score: data.score, correctCount: data.correctCount, totalQuestions: data.totalQuestions });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("taking");
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setResults(null);
    setError("");
    setPhase("idle");
  };

  /* ---- IDLE / LOADING ---- */
  if (phase === "idle" || phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(107,76,224,0.12)" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B4CE0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-semibold text-white/90">
            Lesson Quiz
          </p>
          <p className="text-[13px] mt-1 text-white/50">
            Test your understanding of this lesson with 5 AI-generated questions.
          </p>
        </div>
        {error && (
          <p className="text-[13px] px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={startQuiz}
          disabled={phase === "loading"}
          className="inline-flex items-center gap-2 rounded-full px-6 py-[11px] text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "#6B4CE0", color: "#fff" }}
        >
          {phase === "loading" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating quiz…
            </>
          ) : (
            "Start Quiz"
          )}
        </button>
      </div>
    );
  }

  /* ---- SUBMITTING ---- */
  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <Loader2 size={32} className="animate-spin" style={{ color: "#6B4CE0" }} />
        <p className="text-[14px] text-white/60">Grading your answers…</p>
      </div>
    );
  }

  /* ---- RESULTS ---- */
  if (phase === "results" && results) {
    const resultMap = new Map(results.results.map((r) => [r.questionId, r]));
    return (
      <div className="flex flex-col gap-6 py-6">
        {/* Score card */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40 mb-3">
            Your Score
          </p>
          <p
            className="text-[48px] font-bold leading-none"
            style={{ color: results.score >= 60 ? "#2EE6A8" : "#F87171" }}
          >
            {results.score}%
          </p>
          <p className="text-[13px] mt-2 text-white/50">
            {results.correctCount} of {results.totalQuestions} correct
          </p>
        </div>

        {/* Per-question review */}
        {questions.map((q, i) => {
          const r = resultMap.get(q.id);
          if (!r) return null;
          return (
            <div
              key={q.id}
              className="rounded-xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${r.correct ? "rgba(46,230,168,0.2)" : "rgba(248,113,113,0.2)"}`,
              }}
            >
              <div className="flex items-start gap-3">
                {r.correct ? (
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color: "#2EE6A8" }} />
                ) : (
                  <XCircle size={18} className="shrink-0 mt-0.5" style={{ color: "#F87171" }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-white/85">
                    <span className="text-white/40 mr-1.5">Q{i + 1}.</span>
                    {q.question}
                  </p>
                  {!r.correct && (
                    <div className="mt-2 text-[12.5px] space-y-1">
                      <p style={{ color: "#F87171" }}>
                        Your answer: {answers[q.id] || "(empty)"}
                      </p>
                      <p style={{ color: "#2EE6A8" }}>
                        Correct: {r.correctAnswer}
                      </p>
                    </div>
                  )}
                  {r.correct && q.type === "short-answer" && (
                    <p className="mt-2 text-[12.5px]" style={{ color: "#2EE6A8" }}>
                      Your answer: {answers[q.id]}
                    </p>
                  )}
                  <p className="mt-2 text-[12px] leading-relaxed text-white/45">
                    {r.explanation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowRetakeWarning(true)}
            className="inline-flex items-center gap-2 rounded-full px-6 py-[11px] text-[13.5px] font-medium border transition-colors hover:bg-white/5"
            style={{ color: "#E8ECF4", borderColor: "rgba(255,255,255,0.16)" }}
          >
            <RotateCcw size={14} />
            Retake Quiz
          </button>
        </div>

        {/* Retake warning modal */}
        {showRetakeWarning && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="rounded-2xl p-6 max-w-[400px] w-full"
              style={{ background: "#151E2F", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(251,191,36,0.15)" }}
                >
                  <AlertTriangle size={20} style={{ color: "#FBBF24" }} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white/90">
                    Retake this quiz?
                  </p>
                  <p className="text-[12px] text-white/50">
                    Your current score of {results?.score}% will be replaced.
                  </p>
                </div>
              </div>
              <p className="text-[13px] text-white/50 mb-5 leading-relaxed">
                Retaking this quiz will generate a new set of questions. Your previous score will be
                overwritten in your overall grade calculation. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRetakeWarning(false)}
                  className="flex-1 rounded-full py-2.5 text-[13px] font-medium border transition-colors hover:bg-white/5"
                  style={{ color: "#E8ECF4", borderColor: "rgba(255,255,255,0.16)" }}
                >
                  Keep current score
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRetakeWarning(false);
                    resetQuiz();
                  }}
                  className="flex-1 rounded-full py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "rgba(239,68,68,0.9)", color: "#fff" }}
                >
                  Retake quiz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---- TAKING ---- */
  return (
    <div className="flex flex-col gap-5 py-4">
      {questions.map((q, i) => (
        <div
          key={q.id}
          className="rounded-xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-[14px] font-medium text-white/85 mb-4">
            <span className="text-white/40 mr-1.5">Q{i + 1}.</span>
            {q.question}
            <span
              className="ml-2 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "rgba(107,76,224,0.12)", color: "#A78BFA" }}
            >
              {q.type === "true-false" ? "T/F" : q.type === "mcq" ? "MCQ" : "Short"}
            </span>
          </p>

          {q.type === "mcq" && q.options && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    background:
                      answers[q.id] === opt
                        ? "rgba(107,76,224,0.15)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      answers[q.id] === opt
                        ? "rgba(107,76,224,0.4)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                    className="sr-only"
                  />
                  <span
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor:
                        answers[q.id] === opt ? "#6B4CE0" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    {answers[q.id] === opt && (
                      <span className="w-2 h-2 rounded-full" style={{ background: "#6B4CE0" }} />
                    )}
                  </span>
                  <span className="text-[13px] text-white/75">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "true-false" && (
            <div className="flex gap-3">
              {["True", "False"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className="flex-1 rounded-lg px-4 py-3 text-[13px] font-medium transition-colors"
                  style={{
                    background:
                      answers[q.id] === opt
                        ? "rgba(107,76,224,0.15)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      answers[q.id] === opt
                        ? "rgba(107,76,224,0.4)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                    color: answers[q.id] === opt ? "#A78BFA" : "rgba(255,255,255,0.55)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "short-answer" && (
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Type your answer…"
              rows={3}
              className="w-full rounded-lg px-4 py-3 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-[#6B4CE0]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#E8ECF4",
              }}
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-[13px] text-center px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", color: "#F87171" }}>
          {error}
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={submitQuiz}
          className="inline-flex items-center gap-2 rounded-full px-8 py-[12px] text-[14px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: "#6B4CE0", color: "#fff" }}
        >
          Submit Answers
        </button>
      </div>
    </div>
  );
}
