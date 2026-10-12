"use client";

import type { AnswerValue, TestDetail } from "@/lib/mock-test-ui";

type LayoutQuestion = TestDetail["content"]["sections"][number]["questions"][number];

export type ListeningLayoutProps = {
  questions: LayoutQuestion[];
  answers: Record<string, AnswerValue>;
  questionIndex: Record<string, number>;
  matchBox?: string[];
  onChoice: (qid: string, choice: number) => void;
  onText: (qid: string, value: string) => void;
};

function boxOptions(questions: LayoutQuestion[], matchBox?: string[]): string[] {
  if (Array.isArray(matchBox) && matchBox.some((t) => t.trim())) {
    return matchBox.filter((t) => t.trim());
  }
  for (const q of questions) {
    const opts = (q.options ?? []).filter((o) => o.trim());
    if (opts.length > 0) return opts;
  }
  return [];
}

function LetterChips({
  count,
  selected,
  onPick,
}: {
  count: number;
  selected: number | undefined;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => {
        const active = selected === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(active ? -1 : i)}
            aria-pressed={active}
            className="flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-[12.5px] font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={
              active
                ? { borderColor: "var(--brand)", background: "var(--brand)", color: "#fff" }
                : { borderColor: "var(--line)", background: "white", color: "var(--ink)" }
            }
          >
            {String.fromCharCode(65 + i)}
          </button>
        );
      })}
    </div>
  );
}

/** Authentic IELTS listening MATCHING layout: a shared A–H options box on top,
 *  numbered items below, each answered with a compact dropdown. Options may be
 *  reused freely across questions. */
export function MatchingSection({
  questions,
  answers,
  questionIndex,
  matchBox,
  onChoice,
}: ListeningLayoutProps) {
  const options = boxOptions(questions, matchBox);
  return (
    <div className="flex flex-col gap-4">
      {options.length > 0 && (
        <div className="rounded-xl border bg-[#FBFBFD] p-4" style={{ borderColor: "var(--line)" }}>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--brand-2)" }}>
            Options
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {options.map((opt, oi) => (
              <p key={oi} className="text-[12.5px] leading-[1.55]" style={{ color: "var(--ink)" }}>
                <span className="mr-1.5 font-mono font-bold" style={{ color: "var(--brand-2)" }}>
                  {String.fromCharCode(65 + oi)}.
                </span>
                {opt}
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {questions.map((q) => {
          const num = questionIndex[q.qid] ?? 0;
          const current = answers[q.qid];
          const selected =
            typeof current?.choice === "number" && current.choice >= 0 ? current.choice : -1;
          return (
            <div
              key={q.qid}
              className="flex flex-col gap-2.5 rounded-xl border bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderColor: "var(--line)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[12px] font-bold"
                style={selected >= 0 ? { background: "var(--brand)", color: "#fff" } : { background: "var(--bg-soft)", color: "var(--brand-2)" }}
              >
                {num}
              </span>
              <p className="min-w-0 flex-1 text-[13.5px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                {q.prompt}
              </p>
              <select
                value={selected}
                onChange={(e) => onChoice(q.qid, Number(e.target.value))}
                aria-label={`Answer for question ${num}`}
                className="h-9 shrink-0 cursor-pointer select-none rounded-lg border bg-white px-2.5 font-mono text-[12.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                style={{
                  borderColor: selected >= 0 ? "var(--brand)" : "var(--line)",
                  color: selected >= 0 ? "var(--brand)" : "var(--body)",
                }}
              >
                <option value={-1}>— Choose —</option>
                {options.map((opt, oi) => (
                  <option key={oi} value={oi}>
                    {String.fromCharCode(65 + oi)}. {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Authentic IELTS listening PLAN / MAP / DIAGRAM LABELLING layout:
 *  numbered items answered with a letter (chips) or a typed word/s. */
export function LabellingSection({
  questions,
  answers,
  questionIndex,
  onChoice,
  onText,
}: ListeningLayoutProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {questions.map((q) => {
        const num = questionIndex[q.qid] ?? 0;
        const current = answers[q.qid];
        const opts = (q.options ?? []).filter((o) => o.trim());
        const hasLetters = opts.length > 0;
        const selected =
          typeof current?.choice === "number" && current.choice >= 0 ? current.choice : undefined;
        const text = typeof current?.text === "string" ? current.text : "";
        return (
          <div
            key={q.qid}
            className="flex flex-col gap-2.5 rounded-xl border bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[12px] font-bold"
              style={
                hasLetters
                  ? selected !== undefined
                    ? { background: "var(--brand)", color: "#fff" }
                    : { background: "var(--bg-soft)", color: "var(--brand-2)" }
                  : text.trim()
                    ? { background: "var(--brand)", color: "#fff" }
                    : { background: "var(--bg-soft)", color: "var(--brand-2)" }
              }
            >
              {num}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {q.prompt && (
                <p className="text-[13.5px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                  {q.prompt}
                </p>
              )}
              {hasLetters ? (
                <LetterChips count={opts.length} selected={selected} onPick={(i) => onChoice(q.qid, i)} />
              ) : (
                <input
                  type="text"
                  value={text}
                  onChange={(e) => onText(q.qid, e.target.value)}
                  placeholder="Write the correct letter or word"
                  className="w-full max-w-[260px] select-text rounded-lg border bg-white px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                  style={{
                    borderColor: text.trim() ? "var(--brand)" : "var(--line)",
                    color: "var(--ink)",
                  }}
                />
              )}
              {q.wordHint && (
                <p className="text-[11.5px] font-medium" style={{ color: "var(--brand-2)" }}>
                  {q.wordHint}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
