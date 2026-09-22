"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle, AlertTriangle } from "lucide-react";

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
  const [quizId, setQuizId] = useState<string | null>(null);
  const [mode, setMode] = useState<"ielts" | "general" | null>(null);
  const [ieltsSkill, setIeltsSkill] = useState<string | null>(null);
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
      setQuizId(data.quizId);
      setMode(data.mode === "ielts" ? "ielts" : "general");
      setIeltsSkill(data.ieltsSkill ?? null);
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
          quizId,
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
    setQuizId(null);
    setMode(null);
    setIeltsSkill(null);
    setQuestions([]);
    setAnswers({});
    setResults(null);
    setError("");
    setPhase("idle");
  };

  if (phase === "idle" || phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Lesson Quiz
          </p>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Test your understanding of this lesson with 5 AI-generated questions.
          </p>
        </div>
        {error && (
          <p className="text-[13px] px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={startQuiz}
          disabled={phase === "loading"}
          className="inline-flex items-center gap-2 rounded-full px-6 py-[11px] text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand)", color: "#fff" }}
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

  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
        <p className="text-[14px]" style={{ color: "var(--body)" }}>Grading your answers…</p>
      </div>
    );
  }

  if (phase === "results" && results) {
    const resultMap = new Map(results.results.map((r) => [r.questionId, r]));
    return (
      <div className="flex flex-col gap-6 py-6">
        <div
          className="rounded-2xl p-6 text-center border"
          style={{ background: "var(--bg-soft, rgba(0,0,0,0.02))", borderColor: "var(--line)" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--body)" }}>
            Your Score
          </p>
          <p className="text-[48px] font-bold leading-none" style={{ color: results.score >= 60 ? "#16a34a" : "#dc2626" }}>
            {results.score}%
          </p>
          <p className="text-[13px] mt-2" style={{ color: "var(--body)" }}>
            {results.correctCount} of {results.totalQuestions} correct
          </p>
        </div>

        {questions.map((q, i) => {
          const r = resultMap.get(q.id);
          if (!r) return null;
          return (
            <div
              key={q.id}
              className="rounded-xl p-5 border"
              style={{
                background: "var(--bg-soft, rgba(0,0,0,0.01))",
                borderColor: r.correct ? "rgba(22,163,74,0.25)" : "rgba(239,68,68,0.25)",
              }}
            >
              <div className="flex items-start gap-3">
                {r.correct ? (
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
                ) : (
                  <XCircle size={18} className="shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                    <span className="mr-1.5" style={{ color: "var(--body)" }}>Q{i + 1}.</span>
                    {q.question}
                  </p>
                  {!r.correct && (
                    <div className="mt-2 text-[12.5px] space-y-1">
                      <p style={{ color: "#dc2626" }}>Your answer: {answers[q.id] || "(empty)"}</p>
                      <p style={{ color: "#16a34a" }}>Correct: {r.correctAnswer}</p>
                    </div>
                  )}
                  {r.correct && q.type === "short-answer" && (
                    <p className="mt-2 text-[12.5px]" style={{ color: "#16a34a" }}>Your answer: {answers[q.id]}</p>
                  )}
                  <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "var(--body)" }}>
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
            className="inline-flex items-center gap-2 rounded-full px-6 py-[11px] text-[13.5px] font-medium border transition-colors hover:bg-black/5"
            style={{ color: "var(--ink)", borderColor: "var(--line)" }}
          >
            <RotateCcw size={14} />
            Retake Quiz
          </button>
        </div>

        {showRetakeWarning && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          >
            <div
              className="rounded-2xl p-6 max-w-[400px] w-full border"
              style={{ background: "white", borderColor: "var(--line)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.15)" }}>
                  <AlertTriangle size={20} style={{ color: "#F59E0B" }} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>Retake this quiz?</p>
                  <p className="text-[12px]" style={{ color: "var(--body)" }}>Your current score of {results?.score}% will be replaced.</p>
                </div>
              </div>
              <p className="text-[13px] mb-5 leading-relaxed" style={{ color: "var(--body)" }}>
                Retaking this quiz will generate a new set of questions. Your previous score will be
                overwritten in your overall grade calculation. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRetakeWarning(false)}
                  className="flex-1 rounded-full py-2.5 text-[13px] font-medium border transition-colors hover:bg-black/5"
                  style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                >
                  Keep current score
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRetakeWarning(false); resetQuiz(); }}
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

  return (
    <div className="flex flex-col gap-5 py-4">
      {mode === "ielts" && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }}
          >
            IELTS practice quiz
          </span>
          {ieltsSkill && (
            <span
              className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}
            >
              {ieltsSkill}
            </span>
          )}
        </div>
      )}
      {questions.map((q, i) => (
        <div
          key={q.id}
          className="rounded-xl p-5 border"
          style={{ background: "var(--bg-soft, rgba(0,0,0,0.01))", borderColor: "var(--line)" }}
        >
          <p className="text-[14px] font-medium mb-4" style={{ color: "var(--ink)" }}>
            <span className="mr-1.5" style={{ color: "var(--body)" }}>Q{i + 1}.</span>
            {q.question}
            <span
              className="ml-2 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }}
            >
              {q.type === "true-false" ? "T/F" : q.type === "mcq" ? "MCQ" : "Short"}
            </span>
          </p>

          {q.type === "mcq" && q.options && (
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors border"
                  style={{
                    background: answers[q.id] === opt ? "var(--brand-soft, rgba(107,76,224,0.06))" : "white",
                    borderColor: answers[q.id] === opt ? "var(--brand)" : "var(--line)",
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
                    style={{ borderColor: answers[q.id] === opt ? "var(--brand)" : "var(--line)" }}
                  >
                    {answers[q.id] === opt && <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--ink)" }}>{opt}</span>
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
                  className="flex-1 rounded-lg px-4 py-3 text-[13px] font-medium transition-colors border"
                  style={{
                    background: answers[q.id] === opt ? "var(--brand-soft, rgba(107,76,224,0.06))" : "white",
                    borderColor: answers[q.id] === opt ? "var(--brand)" : "var(--line)",
                    color: answers[q.id] === opt ? "var(--brand)" : "var(--body)",
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
              className="w-full rounded-lg px-4 py-3 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              style={{ background: "white", border: "1px solid var(--line)", color: "var(--ink)" }}
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-[13px] text-center px-4 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
          {error}
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={submitQuiz}
          className="inline-flex items-center gap-2 rounded-full px-8 py-[12px] text-[14px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          Submit Answers
        </button>
      </div>
    </div>
  );
}
