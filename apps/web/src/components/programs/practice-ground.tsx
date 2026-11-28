"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { WritingChart } from "@/components/shared/writing-chart";
import {
  formatTypeLabel,
  type PublicPracticeQuestion,
  type PublicPracticeSetContent,
  type StudentPracticeSetDto,
} from "@/lib/practice/schema";
import type { ChartData } from "@/lib/chart-data";

const CHOICE_TYPES = new Set([
  "multiple-choice",
  "true-false-ng",
  "heading-matching",
  "matching-features",
  "matching",
  "mcq",
  "true-false",
]);

type GradeResult = {
  questionId: string;
  correct: boolean | null;
  correctAnswer: string;
  explanation: string;
  bandScore: number;
  feedback: string;
  exampleAnswer: string;
  comparison: string;
  band7Answer: string;
};

type GradeSummary = {
  mode: "objective" | "subjective" | "mixed";
  score: number;
  correctCount: number;
  objectiveCount: number;
  overallBand: number;
  results: GradeResult[];
};

type Scope = "lesson" | "module" | "all";

function chartOf(question: PublicPracticeQuestion): ChartData | null {
  const chart = question.chart;
  if (!chart || typeof chart !== "object" || Array.isArray(chart)) return null;
  return chart as ChartData;
}

export function PracticeGround({
  courseId,
  courseTitle,
  moduleIndex,
  lessonIndex,
  skill,
}: {
  courseId: string;
  courseTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  skill: string;
}) {
  const [sets, setSets] = useState<StudentPracticeSetDto[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [scope, setScope] = useState<Scope>("module");
  const [skillFilter, setSkillFilter] = useState("all");
  const [activeSet, setActiveSet] = useState<StudentPracticeSetDto | null>(null);
  const [content, setContent] = useState<PublicPracticeSetContent | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<GradeSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingSets(true);
    fetch(`/api/courses/${courseId}/practice-sets`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Failed to load practice sets");
        return data.sets as StudentPracticeSetDto[];
      })
      .then((data) => {
        if (cancelled) return;
        setSets(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingSets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const skills = useMemo(
    () => Array.from(new Set(sets.map((set) => set.skill))).sort(),
    [sets]
  );

  const visibleSets = useMemo(
    () =>
      sets.filter((set) => {
        if (scope === "lesson" && set.lessonIndex !== lessonIndex) return false;
        if (scope === "module" && set.moduleIndex !== moduleIndex) return false;
        if (skillFilter !== "all" && set.skill !== skillFilter) return false;
        return true;
      }),
    [sets, scope, moduleIndex, lessonIndex, skillFilter]
  );

  const openSet = async (set: StudentPracticeSetDto) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/courses/${courseId}/practice-sets/${set.id}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to open practice set");
      setActiveSet(data.set as StudentPracticeSetDto);
      setContent(data.content as PublicPracticeSetContent);
      setAnswers({});
      setGrade(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open practice set");
    } finally {
      setBusy(false);
    }
  };

  const backToSets = () => {
    setActiveSet(null);
    setContent(null);
    setAnswers({});
    setGrade(null);
    setError("");
  };

  const submit = async () => {
    if (!activeSet || !content) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/courses/${courseId}/practice-sets/${activeSet.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: content.questions.map((question) => ({
              questionId: question.id,
              answer: answers[question.id] ?? "",
            })),
          }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to grade practice set");
      setGrade(data as GradeSummary);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grade practice set");
    } finally {
      setBusy(false);
    }
  };

  if (activeSet && content) {
    const resultMap = new Map((grade?.results ?? []).map((result) => [result.questionId, result]));

    return (
      <div className="mt-5 flex flex-col gap-5">
        <button
          type="button"
          onClick={backToSets}
          className="self-start inline-flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--body)" }}
        >
          <ArrowLeft size={15} />
          Back to practice sets
        </button>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--body)" }}>
            {formatTypeLabel(activeSet.skill)} · Set {activeSet.setNumber}
          </p>
          <h2 className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
            {activeSet.title || content.title || "Practice set"}
          </h2>
          {content.instructions && (
            <p className="text-[13px] mt-2" style={{ color: "var(--body)" }}>
              {content.instructions}
            </p>
          )}
        </div>

        {grade && (
          <div
            className="rounded-xl border p-5 flex flex-wrap items-center gap-x-8 gap-y-3"
            style={{ borderColor: "var(--line)", background: "white" }}
          >
            {grade.objectiveCount > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                  Objective score
                </p>
                <p className="font-display text-[26px] font-semibold tabular-nums" style={{ color: "var(--brand)" }}>
                  {grade.score}%
                </p>
                <p className="text-[12px]" style={{ color: "var(--body)" }}>
                  {grade.correctCount} of {grade.objectiveCount} correct
                </p>
              </div>
            )}
            {grade.overallBand > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                  Estimated band
                </p>
                <p className="font-display text-[26px] font-semibold tabular-nums" style={{ color: "var(--brand)" }}>
                  {grade.overallBand}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setGrade(null);
                setAnswers({});
              }}
              className="ml-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
              style={{ color: "var(--ink)", borderColor: "var(--line)" }}
            >
              <RotateCcw size={14} />
              Retake
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-lg border px-4 py-3 text-[13px]" style={{ color: "#dc2626", borderColor: "#fecaca" }}>
            {error}
          </p>
        )}

        {content.passages && content.passages.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
              Passages
            </p>
            {content.passages.map((passage) => (
              <details
                key={passage.id}
                open
                className="rounded-xl border"
                style={{ borderColor: "var(--line)", background: "white" }}
              >
                <summary className="cursor-pointer px-5 py-3 text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {passage.title || passage.id}
                </summary>
                <div
                  className="px-5 pb-5 text-[13.5px] leading-[1.75] whitespace-pre-wrap select-none"
                  style={{ color: "var(--ink)" }}
                >
                  {passage.text}
                </div>
              </details>
            ))}
          </div>
        )}

        {content.audios && Object.entries(content.audios).length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
              Audio
            </p>
            {Object.entries(content.audios).map(([key, audio]) => (
              <div key={key} className="rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "white" }}>
                {audio.url ? <audio controls src={audio.url} className="w-full" /> : null}
                {audio.transcript && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[12.5px] font-medium" style={{ color: "var(--body)" }}>
                      Transcript
                    </summary>
                    <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink)" }}>
                      {audio.transcript}
                    </p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {content.questions.map((question, index) => {
            const result = resultMap.get(question.id);
            const chart = chartOf(question);
            const options = question.options ?? [];
            const answer = answers[question.id] ?? "";

            return (
              <section
                key={question.id}
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--line)", background: "white" }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                    Question {index + 1}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em]"
                    style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }}
                  >
                    {formatTypeLabel(question.type)}
                  </span>
                  {question.passageId && (
                    <span className="text-[11px]" style={{ color: "var(--body)" }}>
                      {question.passageId}
                    </span>
                  )}
                  {result?.correct === true && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#16a34a" }}>
                      <CheckCircle2 size={14} /> Correct
                    </span>
                  )}
                  {result?.correct === false && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#dc2626" }}>
                      <XCircle size={14} /> Incorrect
                    </span>
                  )}
                  {result && result.correct === null && result.bandScore > 0 && (
                    <span className="ml-auto text-[11px] font-semibold" style={{ color: "var(--brand)" }}>
                      Band {result.bandScore}
                    </span>
                  )}
                </div>

                {chart && <WritingChart chart={chart} />}

                <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink)" }}>
                  {question.question}
                </p>

                {options.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    {options.map((option, optionIndex) => (
                      <label
                        key={`${question.id}-${optionIndex}`}
                        className="flex items-start gap-3 rounded-lg border px-4 py-3 text-[13px] cursor-pointer transition-colors"
                        style={{
                          borderColor:
                            answer === option ? "var(--brand)" : "var(--line)",
                          background:
                            answer === option ? "var(--brand-soft, rgba(107,76,224,0.06))" : "transparent",
                          color: "var(--ink)",
                        }}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answer === option}
                          onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                          disabled={Boolean(grade)}
                          className="mt-[3px]"
                          style={{ accentColor: "var(--brand)" }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answer}
                    onChange={(event) =>
                      setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                    }
                    disabled={Boolean(grade)}
                    rows={CHOICE_TYPES.has(question.type) ? 2 : 6}
                    placeholder={CHOICE_TYPES.has(question.type) ? "Type your answer" : "Write your answer here"}
                    className="mt-4 w-full rounded-lg border px-4 py-3 text-[13.5px] outline-none resize-y disabled:opacity-70"
                    style={{ borderColor: "var(--line)", color: "var(--ink)", background: "transparent" }}
                  />
                )}

                {result && (
                  <div
                    className="mt-4 rounded-lg border px-4 py-3 flex flex-col gap-2 text-[13px]"
                    style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
                  >
                    {result.correctAnswer && (
                      <p style={{ color: "var(--ink)" }}>
                        <span className="font-medium" style={{ color: "var(--body)" }}>Correct answer: </span>
                        {result.correctAnswer}
                      </p>
                    )}
                    {result.explanation && (
                      <p style={{ color: "var(--ink)" }}>
                        <span className="font-medium" style={{ color: "var(--body)" }}>Explanation: </span>
                        {result.explanation}
                      </p>
                    )}
                    {result.band7Answer && (
                      <p style={{ color: "var(--ink)" }}>
                        <span className="font-medium" style={{ color: "var(--body)" }}>Band 7 answer: </span>
                        {result.band7Answer}
                      </p>
                    )}
                    {result.feedback && (
                      <p style={{ color: "var(--ink)" }}>
                        <span className="font-medium" style={{ color: "var(--body)" }}>Feedback: </span>
                        {result.feedback}
                      </p>
                    )}
                    {result.exampleAnswer && (
                      <p style={{ color: "var(--ink)" }}>
                        <span className="font-medium" style={{ color: "var(--body)" }}>Example answer: </span>
                        {result.exampleAnswer}
                      </p>
                    )}
                    {result.comparison && (
                      <p style={{ color: "var(--ink)" }}>
                        <span className="font-medium" style={{ color: "var(--body)" }}>Comparison: </span>
                        {result.comparison}
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {!grade && (
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="self-start inline-flex items-center gap-2 rounded-full text-white text-[13px] font-semibold px-6 py-[11px] transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--brand)" }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            {busy ? "Grading…" : "Submit practice set"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
          Practice Ground
        </h2>
        <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
          Question sets prepared for {courseTitle}. Answers stay hidden until you submit.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border px-4 py-3 text-[13px]" style={{ color: "#dc2626", borderColor: "#fecaca" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--bg-soft, rgba(0,0,0,0.03))" }}>
        {([
          ["lesson", "This lesson"],
          ["module", "This module"],
          ["all", "All course sets"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setScope(value)}
            className="rounded-lg px-4 py-2 text-[12.5px] font-medium transition-colors"
            style={
              scope === value
                ? { background: "white", color: "var(--ink)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "var(--body)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {skills.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...skills].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSkillFilter(value)}
              className="rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-black/5"
              style={{
                borderColor: skillFilter === value ? "var(--brand)" : "var(--line)",
                color: skillFilter === value ? "var(--brand)" : "var(--body)",
                background: skillFilter === value ? "var(--brand-soft, rgba(107,76,224,0.06))" : "transparent",
              }}
            >
              {value === "all" ? "All skills" : formatTypeLabel(value)}
            </button>
          ))}
        </div>
      )}

      {loadingSets ? (
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={15} className="animate-spin" />
          Loading practice sets…
        </div>
      ) : visibleSets.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center gap-3 py-16 text-center px-6"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
        >
          <BookOpen size={30} style={{ color: "var(--body)" }} />
          <p className="text-[14px]" style={{ color: "var(--body)" }}>
            No published practice sets here yet.
          </p>
          <p className="text-[12px] max-w-[420px]" style={{ color: "var(--body)" }}>
            Try another filter, or check back after your instructor publishes a set for this course.
          </p>
          {scope !== "all" && (
            <button
              type="button"
              onClick={() => setScope("all")}
              className="rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-black/5"
              style={{ color: "var(--ink)", borderColor: "var(--line)" }}
            >
              View all course sets
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleSets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => void openSet(set)}
              disabled={busy}
              className="rounded-xl border p-5 text-left transition-colors hover:bg-black/[0.02] disabled:opacity-60"
              style={{ borderColor: "var(--line)", background: "white" }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em]"
                  style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }}
                >
                  Set {set.setNumber}
                </span>
                <span className="text-[11px]" style={{ color: "var(--body)" }}>
                  {formatTypeLabel(set.skill)}
                </span>
              </div>
              <p className="mt-4 text-[14px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                {set.title || `Module ${set.moduleIndex + 1} practice`}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: "var(--body)" }}>
                {set.lessonIndex === null
                  ? `Module ${set.moduleIndex + 1}`
                  : `Lesson ${set.lessonIndex + 1}`}
              </p>
              <div className="mt-4 flex items-center gap-4 text-[11.5px]" style={{ color: "var(--body)" }}>
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={13} />
                  {set.questionCount} questions
                </span>
                {set.passageCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={13} />
                    {set.passageCount} passage{set.passageCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
        Tip: start with <span className="font-medium">This module</span> for IELTS practice, or{" "}
        <span className="font-medium">This lesson</span> for lesson-linked courses.
      </p>
    </div>
  );
}
