import "server-only";

import { getProvider } from "@/lib/ai/provider";
import type { MockTestSkill } from "@/lib/models/mock-test";

export type JudgeSectionScore = {
  key: string;
  title: string;
  band: number;
  comments: string;
};

export type JudgeResult = {
  overallBand: number;
  sections: JudgeSectionScore[];
  feedback: string;
};

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

export function buildJudgePrompt(opts: {
  skill: MockTestSkill;
  title: string;
  content: {
    passage?: string | null;
    passages?: { id?: string | null; title?: string | null; text?: string | null }[] | null;
    writingTask1?: string | null;
    writingTask2?: string | null;
  };
  sections: {
    id?: string | null;
    type?: string | null;
    passageId?: string | null;
    questions: {
      qid?: string | null;
      prompt?: string | null;
      options?: string[] | null;
      correctOption?: number | null;
      answer?: string | null;
    }[];
  }[];
  answerKey?: string;
  answers: Record<string, { choice?: number; text?: string } | undefined>;
}): { system: string; user: string } {
  const isWriting = opts.skill === "writing";
  const answerLines = opts.sections
    .flatMap((s) =>
      (s.questions ?? []).map((q) => {
        const optIdx =
          typeof q.correctOption === "number" ? q.correctOption : -1;
        const optText =
          optIdx >= 0 &&
          Array.isArray(q.options) &&
          typeof q.options[optIdx] === "string"
            ? q.options[optIdx]
            : "";
        const expected = optText || q.answer?.trim() || "—";
        return `${q.qid}: ${expected}`;
      })
    )
    .join("\n");

  const gradedLines = opts.sections
    .flatMap((s) =>
      (s.questions ?? []).map((q) => {
        const raw = opts.answers[q.qid ?? ""];
        const picked =
          raw?.choice !== undefined && raw.choice >= 0
            ? `[choice ${raw.choice}]`
            : raw?.text?.trim() || "(no answer)";
        return `${q.qid}: ${q.prompt ?? ""}`;
      })
    )
    .join("\n");

  const answeredLines = opts.sections
    .flatMap((s) =>
      (s.questions ?? []).map((q) => {
        const raw = opts.answers[q.qid ?? ""];
        const picked =
          raw?.choice !== undefined && raw.choice >= 0
            ? `[choice ${raw.choice}]`
            : (raw?.text ?? "").trim();
        return `${q.qid} → ${picked || "(no answer)"}`;
      })
    )
    .join("\n");

  const system = [
    "You are flybridge-ielts-judge, the official IELTS mock-test grading engine",
    "for FlyBridge Education Group.",
    isWriting
      ? [
          "You grade WRITING test answers against the official IELTS Writing band",
          "descriptors (Task Response / Coherence and Cohesion / Lexical Resource /",
          "Grammatical Range and Accuracy) and assign each task a band.",
        ].join("\n")
      : "You grade READING/LISTENING answers against the provided answer key.",
    "",
    "## Output format",
    "Return ONLY a valid JSON object. No markdown, no explanation.",
    isWriting
      ? [
          '  "band":     overall Writing band (0-9 · 0.5 steps)',
          '  "sections": [ { "key": "writingTask1", "title": "Task 1", "band": 6.5, "comments": "short note" },',
          '               { "key": "writingTask2", "title": "Task 2", "band": 6.5, "comments": "short note" } ]',
          '  "feedback": 2-4 sentence actionable feedback on how to improve.',
        ].join("\n")
      : [
          '  "band":         overall band (0-9 · 0.5 steps) derived from correct count',
          '  "correctCount": number of correct answers',
          '  "totalCount":   total number of questions',
          '  "sections":     per-section bands, e.g. [ { "key": "s1", "title": "..." } ]',
          '  "feedback":     2-4 sentence actionable feedback on how to improve.',
        ].join("\n"),
    "",
    "## Rules",
    isWriting
      ? [
          "- Be strict and realistic; a typical learner lands between 5.0 and 7.5.",
          "- Reward clear ideas, good paragraphing, accurate grammar and a",
          "  suitable range of vocabulary.",
          "- Band must be in 0.5 increments (no 6.25 etc).",
        ].join("\n")
      : [
          "- Mark an answer correct only if it matches the answer key exactly or is a",
          "  clear semantic/technical equivalent (e.g. case, tense, article/number).",
          "- \"Not Given\" is only correct when the answer key says Not Given/NG.",
          "- Convert the correct count to a band using standard IELTS raw-score",
          "  guidelines (Reading: 30/40 → ~7.0, 23/40 → ~6.0; adjust for timing).",
          "- Band must be in 0.5 increments.",
        ].join("\n"),
  ].join("\n");

  const passagesText = (opts.content.passages ?? [])
    .map((p) => `${p.title ?? p.id ?? "Passage"}\n${p.text ?? ""}`)
    .join("\n\n");

  const user = [
    `Test: ${opts.title}`,
    `Skill: ${opts.skill.toUpperCase()}`,
    ...(opts.content.passage
      ? ["", "## Passage", opts.content.passage]
      : []),
    ...(passagesText && !opts.content.passage
      ? ["", "## Passages", passagesText]
      : []),
    ...(isWriting && opts.content.writingTask1
      ? ["", "## Writing Task 1", opts.content.writingTask1]
      : []),
    ...(isWriting && opts.content.writingTask2
      ? ["", "## Writing Task 2", opts.content.writingTask2]
      : []),
    ...(!isWriting
      ? [
          "",
          "## Questions",
          gradedLines || "(no structured questions)",
          "",
          "## Candidate answers",
          answeredLines || "(none)",
        ]
      : ["", "## Candidate answers", "Task 1:", opts.answers["writingTask1"]?.text ?? "(no answer)", "Task 2:", opts.answers["writingTask2"]?.text ?? "(no answer)"]),
    ...(!isWriting ? ["", "## Answer key", answerLines || opts.answerKey || "(none)"] : []),
  ].join("\n");

  return { system, user };
}

/* ------------------------------------------------------------------ */
/*  Parsing                                                            */
/* ------------------------------------------------------------------ */

function stripCodeFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }
  return s.trim();
}

function clampBand(band: number): number {
  const rounded = Math.round((band + Number.EPSILON) * 2) / 2;
  return Math.min(9, Math.max(0, rounded));
}

function clampScore<T extends { band: number }>(sections: T[]): T[] {
  return sections.map((s) => ({ ...s, band: clampBand(s.band) }));
}

/* ------------------------------------------------------------------ */
/*  Grading                                                            */
/* ------------------------------------------------------------------ */

export async function judgeMockTestAttempt(opts: {
  skill: MockTestSkill;
  title: string;
  content: {
    passage?: string | null;
    passages?: { id?: string | null; title?: string | null; text?: string | null }[] | null;
    writingTask1?: string | null;
    writingTask2?: string | null;
  };
  sections: {
    id?: string | null;
    type?: string | null;
    passageId?: string | null;
    questions: {
      qid?: string | null;
      prompt?: string | null;
      options?: string[] | null;
      correctOption?: number | null;
      answer?: string | null;
    }[];
  }[];
  answerKey?: string;
  answers: Record<string, { choice?: number; text?: string } | undefined>;
}): Promise<JudgeResult> {
  const provider = await getProvider();

  const run = async () => {
    const { system, user } = buildJudgePrompt(opts);
    const stream = await provider.streamChat({
      model: process.env.AI_MODEL ?? "",
      system,
      messages: [{ role: "user", content: user }],
      jsonMode: true,
      maxTokens: 8192,
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let full = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += value.text;
      }
    } finally {
      reader.releaseLock();
    }

    const parsed = JSON.parse(stripCodeFences(full)) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("flybridge-ielts-judge returned an invalid result");
    }
    return parsed;
  };

  let parsed: Record<string, unknown> | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      parsed = await run();
      break;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
  if (!parsed) throw new Error("flybridge-ielts-judge returned an invalid result");

  const rawSections = Array.isArray(parsed.sections)
    ? (parsed.sections as Record<string, unknown>[])
        .filter((s) => s)
        .map((s) => ({
          key: typeof s.key === "string" ? s.key : "",
          title:
            typeof s.title === "string"
              ? s.title
              : typeof s.key === "string"
                ? s.key
                : "Section",
          band: clampBand(Number(s.band) || 0),
          comments: typeof s.comments === "string" ? s.comments : "",
        }))
    : [];

  const overallBand = clampBand(Number(parsed.band) || 0);

  return {
    overallBand,
    sections: clampScore(rawSections),
    feedback:
      typeof parsed.feedback === "string"
        ? parsed.feedback
        : "Your test was graded. Review the section bands for details.",
  };
}