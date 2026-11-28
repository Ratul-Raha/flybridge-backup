"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Headphones,
  Loader2,
  Mic,
  PenLine,
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
  "true-false-not-given",
  "yes-no-not-given",
  "heading-matching",
  "matching-headings",
  "matching-features",
  "matching-information",
  "matching-sentence-endings",
  "matching",
  "mcq",
  "true-false",
]);

const SKILLS = [
  { key: "reading", label: "Reading", icon: BookOpen },
  { key: "listening", label: "Listening", icon: Headphones },
  { key: "writing", label: "Writing", icon: PenLine },
  { key: "speaking", label: "Speaking", icon: Mic },
] as const;

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

function chartOf(question: PublicPracticeQuestion): ChartData | null {
  const chart = question.chart;
  if (!chart || typeof chart !== "object" || Array.isArray(chart)) return null;
  return chart as ChartData;
}

function skillLabel(skill: string): string {
  return SKILLS.find((item) => item.key === skill)?.label ?? formatTypeLabel(skill);
}

export function PracticeGround({
  courseId,
  courseTitle,
  onExit,
}: {
  courseId: string;
  courseTitle: string;
  onExit: () => void;
}) {
  const [sets, setSets] = useState<StudentPracticeSetDto[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [skill, setSkill] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
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
        if (!cancelled) setSets(Array.isArray(data) ? data : []);
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

  const availableSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const set of sets) {
      counts.set(set.skill, (counts.get(set.skill) ?? 0) + set.questionCount);
    }
    return SKILLS.filter((item) => (counts.get(item.key) ?? 0) > 0).map((item) => ({
      ...item,
      count: counts.get(item.key) ?? 0,
    }));
  }, [sets]);

  const availableTypes = useMemo(() => {
    if (!skill) return [];
    const counts = new Map<string, number>();
    for (const set of sets.filter((entry) => entry.skill === skill)) {
      for (const [typeKey, count] of Object.entries(set.typeCounts ?? {})) {
        counts.set(typeKey, (counts.get(typeKey) ?? 0) + (Number(count) || 0));
      }
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1] || formatTypeLabel(a[0]).localeCompare(formatTypeLabel(b[0])));
  }, [sets, skill]);

  const loadGroup = async (skillKey: string, typeKey: string) => {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ skill: skillKey, type: typeKey });
      const response = await fetch(`/api/courses/${courseId}/practice/groups?${params}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to load practice questions");
      setSkill(skillKey);
      setType(typeKey);
      setActiveSet(data.set as StudentPracticeSetDto);
      setContent(data.content as PublicPracticeSetContent);
      setAnswers({});
      setGrade(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load practice questions");
    } finally {
      setBusy(false);
    }
  };

  const chooseType = (typeKey: string) => {
    if (!skill) return;
    void loadGroup(skill, typeKey);
  };

  const backToTypes = () => {
    setType(null);
    setActiveSet(null);
    setContent(null);
    setAnswers({});
    setGrade(null);
    setError("");
  };

  const backToSkills = () => {
    setSkill(null);
    backToTypes();
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

  if (activeSet && content && skill && type) {
    const resultMap = new Map((grade?.results ?? []).map((result) => [result.questionId, result]));

    return (
      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={backToTypes}
            className="inline-flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--body)" }}
          >
            <ArrowLeft size={15} />
            Question types
          </button>
          <span style={{ color: "var(--line)" }}>·</span>
          <button
            type="button"
            onClick={onExit}
            className="text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--body)" }}
          >
            Back to lessons
          </button>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
              {skillLabel(skill)} · {formatTypeLabel(type)}
            </p>
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em]"
              style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }}
            >
              Random set
            </span>
          </div>
          <h2 className="font-display text-[19px] font-semibold mt-1" style={{ color: "var(--ink)" }}>
            {content.title || activeSet.title || `${skillLabel(skill)} practice`}
          </h2>
          {content.instructions && (
            <p className="text-[13px] mt-2" style={{ color: "var(--body)" }}>
              {content.instructions}
            </p>
          )}
          <button
            type="button"
            onClick={() => void loadGroup(skill, type)}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-black/5 disabled:opacity-60"
            style={{ color: "var(--ink)", borderColor: "var(--line)" }}
          >
            <RotateCcw size={14} />
            New random questions
          </button>
        </div>

        {grade && (
          <div
            className="rounded-xl border p-5 flex flex-wrap items-center gap-x-8 gap-y-3"
            style={{ borderColor: "var(--line)", background: "white" }}
          >
            {grade.objectiveCount > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                  Score
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
              Passage
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
                {passage.instructions && (
                  <p className="px-5 text-[12.5px] leading-relaxed" style={{ color: "var(--body)" }}>
                    {passage.instructions}
                  </p>
                )}
                <div
                  className="px-5 pb-5 pt-3 text-[13.5px] leading-[1.75] whitespace-pre-wrap select-none"
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
                          borderColor: answer === option ? "var(--brand)" : "var(--line)",
                          background: answer === option ? "var(--brand-soft, rgba(107,76,224,0.06))" : "transparent",
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
            {busy ? "Grading…" : "Submit answers"}
          </button>
        )}
      </div>
    );
  }

  if (skill) {
    return (
      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={backToSkills}
            className="inline-flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--body)" }}
          >
            <ArrowLeft size={15} />
            All modules
          </button>
          <span style={{ color: "var(--line)" }}>·</span>
          <button
            type="button"
            onClick={onExit}
            className="text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--body)" }}
          >
            Back to lessons
          </button>
        </div>

        <div>
          <h2 className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
            {skillLabel(skill)} question types
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Choose a question type. You’ll get a random related passage and questions from a published set.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border px-4 py-3 text-[13px]" style={{ color: "#dc2626", borderColor: "#fecaca" }}>
            {error}
          </p>
        )}

        {availableTypes.length === 0 ? (
          <div
            className="rounded-xl border px-5 py-14 text-center"
            style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
          >
            <p className="text-[14px]" style={{ color: "var(--body)" }}>
              No question types published for {skillLabel(skill)} yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {availableTypes.map(([typeKey]) => (
              <button
                key={typeKey}
                type="button"
                onClick={() => chooseType(typeKey)}
                disabled={busy}
                className="rounded-xl border p-5 text-left transition-colors hover:bg-black/[0.02] disabled:opacity-60"
                style={{ borderColor: "var(--line)", background: "white" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em]"
                    style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }}
                  >
                    Random
                  </span>
                </div>
                <p className="mt-4 text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  {formatTypeLabel(typeKey)}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--body)" }}>
                  Start practice
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
            Practice Ground
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Independent practice for {courseTitle}. Choose a module, then a question type.
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-black/5"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          Back to lessons
        </button>
      </div>

      {error && (
        <p className="rounded-lg border px-4 py-3 text-[13px]" style={{ color: "#dc2626", borderColor: "#fecaca" }}>
          {error}
        </p>
      )}

      {loadingSets ? (
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={15} className="animate-spin" />
          Loading practice modules…
        </div>
      ) : availableSkills.length === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center gap-3 py-16 text-center px-6"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
        >
          <FileText size={30} style={{ color: "var(--body)" }} />
          <p className="text-[14px]" style={{ color: "var(--body)" }}>
            No published practice sets yet.
          </p>
          <p className="text-[12px] max-w-[420px]" style={{ color: "var(--body)" }}>
            Upload and publish a question set in Quiz Manager to open this module.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {availableSkills.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSkill(item.key)}
                className="rounded-xl border p-5 text-left transition-colors hover:bg-black/[0.02]"
                style={{ borderColor: "var(--line)", background: "white" }}
              >
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))" }}
                >
                  <Icon size={20} style={{ color: "var(--brand)" }} />
                </span>
                <p className="mt-4 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  {item.label}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--body)" }}>
                  Start practice
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
