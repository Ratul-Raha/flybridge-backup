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
    writingTask1Chart?: {
      chartType: string;
      title?: string | null;
      xAxis?: string[] | null;
      yAxisLabel?: string | null;
      categories?: string[] | null;
      series?: { name?: string | null; data?: number[] | null }[] | null;
      unit?: string | null;
      source?: string | null;
    } | null;
    writingTask2?: string | null;
  };
  sections: {
    id?: string | null;
    type?: string | null;
    passageId?: string | null;
    instructions?: string | null;
    bulletPoints?: string[] | null;
    prepMinutes?: number | null;
    talkMinutes?: number | null;
    questions: {
      qid?: string | null;
      prompt?: string | null;
      options?: string[] | null;
      correctOption?: number | null;
      correctOptions?: number[] | null;
      multiple?: boolean | null;
      answer?: string | null;
      gapAnswers?: string[] | null;
    }[];
  }[];
  answerKey?: string;
  answers: Record<
    string,
    | {
        choice?: number;
        choices?: number[];
        text?: string;
        gaps?: string[];
        pronunciation?: {
          accuracyScore?: number;
          fluencyScore?: number;
          completenessScore?: number;
          pronunciationScore?: number;
          prosodyScore?: number;
          words?: Array<{ word?: string; accuracyScore?: number; errorType?: string }>;
        };
      }
    | undefined
  >;
}): { system: string; user: string } {
  const isWriting = opts.skill === "writing";
  const isSpeaking = opts.skill === "speaking";
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
        const isMulti = q.multiple === true;
        const multiLetters = Array.isArray(q.correctOptions)
          ? q.correctOptions
              .slice()
              .sort((a, b) => a - b)
              .map((i) => String.fromCharCode(65 + i))
              .join(", ")
          : "";
        const gapAnswers = Array.isArray(q.gapAnswers) ? q.gapAnswers.filter((a) => typeof a === "string" && a.trim()) : [];
        const expected = gapAnswers.length > 0
          ? gapAnswers.map((a, i) => `Gap ${i + 1}: ${a.trim()}`).join(" | ")
          : isMulti
          ? multiLetters || q.answer?.trim() || "—"
          : optIdx >= 0
            ? `${String.fromCharCode(65 + optIdx)}${optText ? `. ${optText}` : ""}`
            : q.answer?.trim() || "—";
        return `${q.qid}: ${expected}`;
      })
    )
    .join("\n");

  const gradedLines = opts.sections
    .flatMap((s) =>
      (s.questions ?? []).map((q) => {
        const optsList = Array.isArray(q.options) ? q.options : [];
        const optionText = optsList.length
          ? optsList
              .map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`)
              .join("; ")
          : "";
        return `${q.qid}: ${q.prompt ?? ""}${optionText ? `  [Options: ${optionText}]` : ""}`;
      })
    )
    .join("\n");

  const answeredLines = opts.sections
    .flatMap((s) =>
      (s.questions ?? []).map((q) => {
        const raw = opts.answers[q.qid ?? ""];
        const letterOf = (i: number) => String.fromCharCode(65 + i);
        const picked =
          Array.isArray(raw?.gaps) && raw.gaps.length > 0
            ? raw.gaps.map((a, i) => `Gap ${i + 1}: ${(a ?? "").trim() || "(blank)"}`).join(" | ")
            :
          Array.isArray(raw?.choices) && raw.choices.length > 0
            ? raw.choices
                .slice()
                .sort((a, b) => a - b)
                .map(letterOf)
                .join(", ")
            : raw?.choice !== undefined && raw.choice >= 0
              ? letterOf(raw.choice)
            : (raw?.text ?? "").trim();
        return `${q.qid} → ${picked || "(no answer)"}`;
      })
    )
    .join("\n");

  const system = [
    "You are flybridge-ielts-judge, the official IELTS mock-test grading engine",
    "for FlyBridge Education Group.",
    isSpeaking
      ? [
          "You grade SPEAKING test answers against the official IELTS Speaking band",
          "descriptors across the four criteria: Fluency and Coherence, Lexical",
          "Resource, Grammatical Range and Accuracy, and Pronunciation. Grade each",
          "part of the test (Part 1, Part 2, Part 3) separately, then derive the",
          "overall band.",
        ].join("\n")
      : isWriting
        ? [
            "You grade WRITING test answers against the official IELTS Writing band",
            "descriptors (Task Response / Coherence and Cohesion / Lexical Resource /",
            "Grammatical Range and Accuracy) and assign each task a band.",
          ].join("\n")
        : "You grade READING/LISTENING answers against the provided answer key.",
    "",
    "## Output format",
    "Return ONLY a valid JSON object. No markdown, no explanation.",
    isSpeaking
      ? [
          '  "band":     overall Speaking band (0-9 · 0.5 steps)',
          '  "sections": [ { "key": "part1", "title": "Part 1", "band": 6.5, "comments": "FC 6.5 · LR 6 · GR 6 · P 7 — short note" },',
          '               { "key": "part2", "title": "Part 2", "band": 6.0, "comments": "FC 6 · LR 6.5 · GR 6 · P 6.5 — short note" },',
          '               { "key": "part3", "title": "Part 3", "band": 6.5, "comments": "FC 6.5 · LR 6.5 · GR 6.5 · P 7 — short note" } ]',
          '  "feedback": 2-4 sentence actionable feedback on how to improve.',
        ].join("\n")
      : isWriting
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
    isSpeaking
      ? [
          "- Use the official IELTS Speaking band descriptors for every criterion.",
          "- Score all four criteria (Fluency and Coherence, Lexical Resource,",
          "  Grammatical Range and Accuracy, Pronunciation) for each part, and",
          "  summarise them in \"comments\" as e.g. \"FC 6.5 · LR 6 · GR 6 · P 7\"",
          "  followed by a short 1-2 sentence note.",
          "- Do not penalise natural accent features; focus on intelligibility, stress/intonation",
          "  patterns, and errors that impede communication or deviate from standard forms.",
          "- If AzurePronunciation scores are provided, factor them into Pronunciation, but",
          "  still judge against IELTS descriptors holistically.",
          "- Grade from the transcript and any provided pronunciation metrics; do not penalise",
          "  a blank part beyond recording that no response was captured there.",
          "- Be strict and realistic; a typical learner lands between 5.0 and 7.5.",
          "- Band must be in 0.5 increments (no 6.25 etc).",
        ].join("\n")
      : isWriting
        ? [
            "- Be strict and realistic; a typical learner lands between 5.0 and 7.5.",
            "- Reward clear ideas, good paragraphing, accurate grammar and a",
            "  suitable range of vocabulary.",
            "- For Task 1, use the authoritative visual data supplied in the user prompt.",
            "  Check whether the response selects an accurate overview, compares the",
            "  relevant categories or series, and reports key values and trends without",
            "  inventing or reversing information from the chart.",
            "- Band must be in 0.5 increments (no 6.25 etc).",
          ].join("\n")
        : [
            "- Mark an answer correct only if it matches the answer key exactly or is a",
            "  clear semantic/technical equivalent (e.g. case, tense, article/number).",
            "- \"Not Given\" is only correct when the answer key says Not Given/NG.",
            "- For multiple-choice questions, both the answer key and the candidate's",
            "  answers use option letters (A, B, C, …): a single letter for one answer and",
            "  a comma-separated list for multi-answer questions.",
            "- For a question whose answer key lists several letters (e.g. \"A, C\"), the",
            "  candidate must have selected exactly that set — no more, no fewer.",
            "- Convert the correct count to a band using standard IELTS raw-score",
            "  guidelines (Reading and Listening: 30/40 → ~7.0, 23/40 → ~6.0, 39/40 → 9.0).",
            "- Band must be in 0.5 increments.",
          ].join("\n"),
  ].join("\n");

  const passagesText = (opts.content.passages ?? [])
    .map((p) => `${p.title ?? p.id ?? "Passage"}\n${p.text ?? ""}`)
    .join("\n\n");

  const user = isSpeaking
    ? buildSpeakingUserLines(opts).join("\n")
    : [
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
        ...(isWriting && opts.content.writingTask1Chart
          ? [
              "",
              "## Writing Task 1 visual data (authoritative)",
              JSON.stringify(opts.content.writingTask1Chart),
              "Use these exact categories, series and values when judging Task 1 accuracy. Do not infer or invent visual data.",
            ]
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

type SpeakingJudgeOpts = {
  sections: {
    type?: string | null;
    instructions?: string | null;
    bulletPoints?: string[] | null;
    prepMinutes?: number | null;
    talkMinutes?: number | null;
    questions: { qid?: string | null; prompt?: string | null }[];
  }[];
  answers: Record<
    string,
    | {
        text?: string;
        pronunciation?: {
          accuracyScore?: number;
          fluencyScore?: number;
          completenessScore?: number;
          pronunciationScore?: number;
          prosodyScore?: number;
          words?: Array<{ word?: string; accuracyScore?: number; errorType?: string }>;
        };
      }
    | undefined
  >;
  title: string;
};

/** Builds the per-part transcript listing the speaking judge grades. */
function buildSpeakingUserLines(opts: SpeakingJudgeOpts): string[] {
  const lines: string[] = [`Test: ${opts.title}`, "Skill: SPEAKING"];
  opts.sections.forEach((s, i) => {
    const partType = (s.type ?? "").toLowerCase();
    const isPart2 =
      partType.includes("part-2") ||
      (Array.isArray(s.bulletPoints) && s.bulletPoints.length > 0) ||
      (s.prepMinutes ?? 0) > 0 ||
      (s.talkMinutes ?? 0) > 0;
    const label = partType.includes("part-1")
      ? "Part 1 · Introduction and interview"
      : isPart2
        ? "Part 2 · Individual long turn"
        : partType.includes("part-3")
          ? "Part 3 · Two-way discussion"
          : `Part ${i + 1}`;
    lines.push("", `## ${label}`);

    if (isPart2) {
      if (s.instructions?.trim()) {
        lines.push(`Cue card topic: ${s.instructions.trim()}`);
      }
      if (Array.isArray(s.bulletPoints) && s.bulletPoints.length > 0) {
        lines.push("Cue card points:");
        for (const b of s.bulletPoints) lines.push(`- ${b}`);
      }
      for (const q of s.questions ?? []) {
        if (q.prompt?.trim()) lines.push(`Task: ${q.prompt.trim()}`);
      }
      const transcript = (s.questions ?? [])
        .map((q) => opts.answers[q.qid ?? ""]?.text ?? "")
        .filter((t) => t.trim())
        .join(" ");
      lines.push(`Candidate response: ${transcript.trim() || "(no answer recorded)"}`);
      return;
    }

    for (const q of s.questions ?? []) {
      lines.push(`Q: ${q.prompt ?? ""}`);
      const ans = opts.answers[q.qid ?? ""];
      const text = ans?.text ?? "";
      lines.push(`Candidate: ${text.trim() || "(no answer)"}`);
      const p = ans?.pronunciation;
      if (
        p &&
        (p.pronunciationScore !== undefined ||
          p.accuracyScore !== undefined ||
          p.fluencyScore !== undefined ||
          p.completenessScore !== undefined ||
          p.prosodyScore !== undefined)
      ) {
        const parts = [
          p.pronunciationScore !== undefined ? `Pron=${p.pronunciationScore}` : null,
          p.accuracyScore !== undefined ? `Acc=${p.accuracyScore}` : null,
          p.fluencyScore !== undefined ? `Flu=${p.fluencyScore}` : null,
          p.completenessScore !== undefined ? `Comp=${p.completenessScore}` : null,
          p.prosodyScore !== undefined ? `Prosody=${p.prosodyScore}` : null,
        ].filter(Boolean);
        if (parts.length) lines.push(`AzurePronunciation: ${parts.join(" ")}`);
      }
      const weak = Array.isArray(p?.words)
        ? p.words
            .filter((w: any) => typeof w.accuracyScore === "number" && w.accuracyScore < 80 && w.word)
            .slice(0, 10)
            .map((w: any) => `${w.word}(${w.accuracyScore}${w.errorType ? `:${w.errorType}` : ""})`)
        : [];
      if (weak.length) lines.push(`PotentialPronIssues: ${weak.join(", ")}`);
    }
  });
  return lines;
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
    writingTask1Chart?: {
      chartType: string;
      title?: string | null;
      xAxis?: string[] | null;
      yAxisLabel?: string | null;
      categories?: string[] | null;
      series?: { name?: string | null; data?: number[] | null }[] | null;
      unit?: string | null;
      source?: string | null;
    } | null;
    writingTask2?: string | null;
  };
  sections: {
    id?: string | null;
    type?: string | null;
    passageId?: string | null;
    instructions?: string | null;
    bulletPoints?: string[] | null;
    prepMinutes?: number | null;
    talkMinutes?: number | null;
    questions: {
      qid?: string | null;
      prompt?: string | null;
      options?: string[] | null;
      correctOption?: number | null;
      correctOptions?: number[] | null;
      multiple?: boolean | null;
       answer?: string | null;
       gapAnswers?: string[] | null;
    }[];
  }[];
  answerKey?: string;
  answers: Record<
    string,
    | {
        choice?: number;
        choices?: number[];
        text?: string;
        gaps?: string[];
        pronunciation?: {
          accuracyScore?: number;
          fluencyScore?: number;
          completenessScore?: number;
          pronunciationScore?: number;
          prosodyScore?: number;
          words?: Array<{ word?: string; accuracyScore?: number; errorType?: string }>;
        };
      }
    | undefined
  >;
}, provider?: string | null): Promise<JudgeResult> {
  const activeProvider = await getProvider(provider);

  const run = async () => {
    const { system, user } = buildJudgePrompt(opts);
    const stream = await activeProvider.streamChat({
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
