import "server-only";

import { getProvider } from "@/lib/ai/provider";
import type { QuizQuestion } from "@/lib/ai/quiz";

export type WrittenFeedback = {
  questionId: string;
  bandScore: number;
  feedback: string;
  exampleAnswer: string;
  comparison: string;
};

export type ObjectiveFeedback = {
  questionId: string;
  explanation: string;
  band7Answer: string;
  comparison: string;
};

/** Cheap model for grading — falls back to the main AI model. */
const QUIZ_MODEL = process.env.AI_QUIZ_MODEL || process.env.AI_MODEL || "";

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

function buildJudgePrompt(opts: {
  skill: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
}): { system: string; user: string } {
  const system = [
    "You are flybridge-ielts-judge, the official IELTS grading engine for FlyBridge",
    "Education Group.",
    "",
    `You grade ${opts.skill.toUpperCase()} answers written by students. Grade each answer`,
    "against the official IELTS band descriptors (Task Achievement / Coherence and",
    "Cohesion / Lexical Resource / Grammatical Range and Accuracy) and assign each answer",
    "a band.",
    "",
    "## Output format",
    "Return ONLY a valid JSON object keyed by questionId. No markdown, no explanation,",
    "no preamble.",
    "",
    "Example shape:",
    '{ "q1": { "bandScore": 6.5, "feedback": "...", "exampleAnswer": "...", "comparison": "..." },',
    '  "q2": { "bandScore": 6, "feedback": "...", "exampleAnswer": "...", "comparison": "..." } }',
    "",
    "## Rules",
    "- Be strict and realistic; a typical learner lands between 5.0 and 7.5.",
    "- Band must be in 0.5 increments (no 6.25 etc).",
    "- Keep every field SHORT: feedback and comparison must stay to 1-2 sentences, and",
    "  exampleAnswer to a few sentences. Do not pad.",
    "- Grade EVERY question in the list. The JSON object MUST contain one entry for",
    "  each question id, keyed by that id.",
    "- Return ONLY the JSON object, nothing else.",
  ].join("\n");

  const gradedLines = opts.questions
    .map((q) => {
      const answer = (opts.answers[q.id] ?? "").trim();
      return [
        `Question ${q.id}: ${q.question}`,
        ...(q.chart
          ? [
              "Visual data (authoritative — judge the response against these exact",
              `categories, series and values): ${JSON.stringify(q.chart)}`,
            ]
          : []),
        `Student answer: ${answer || "(no answer)"}`,
      ].join("\n");
    })
    .join("\n\n");

  const user = [
    `Skill: ${opts.skill.toUpperCase()}`,
    "",
    "## Questions and student answers",
    gradedLines,
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
  const firstBracket = s.indexOf("[");
  const lastBracket = s.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    s = s.slice(firstBracket, lastBracket + 1);
  }
  return s.trim();
}

function clampBand(band: number): number {
  const rounded = Math.round((band + Number.EPSILON) * 2) / 2;
  return Math.min(9, Math.max(0, rounded));
}

/**
 * json_object mode forces the model to return an object, and the requested
 * keyed-object shape sometimes degrades into an array or a single grade object.
 * Accept all three shapes and normalize to a list of grade records.
 */
function extractGrades(raw: unknown): Record<string, unknown>[] {
  const asRecords = (list: unknown[]): Record<string, unknown>[] =>
    list.filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r));

  if (Array.isArray(raw)) return asRecords(raw);
  if (!raw || typeof raw !== "object") return [];

  const rec = raw as Record<string, unknown>;
  for (const key of ["results", "grades", "answers", "reviews", "questions", "data"]) {
    const v = rec[key];
    if (Array.isArray(v)) return asRecords(v);
  }

  // Single grade object: {"questionId": "q1", "bandScore": 2, ...}
  if (typeof rec.questionId === "string" || typeof rec.bandScore === "number" ||
      typeof rec.explanation === "string") {
    return [rec];
  }

  // Keyed object: {"q1": {...}, "q2": {...}}
  const values = Object.values(rec);
  if (values.length > 0 && values.every((v) => !!v && typeof v === "object" && !Array.isArray(v))) {
    return Object.entries(rec).map(([key, v]) => {
      const r = { ...(v as Record<string, unknown>) };
      if (typeof r.questionId !== "string") r.questionId = key;
      return r;
    });
  }

  return [];
}

/* ------------------------------------------------------------------ */
/*  Grading                                                            */
/* ------------------------------------------------------------------ */

/**
 * Runs one judge call and normalizes the reply to a list of grade records.
 */
async function runJudge(
  system: string,
  user: string
): Promise<Record<string, unknown>[]> {
  const provider = await getProvider();

  const stream = await provider.streamChat({
    model: QUIZ_MODEL,
    system,
    messages: [{ role: "user", content: user }],
    jsonMode: true,
    maxTokens: 4096,
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

  const parsed = JSON.parse(stripCodeFences(full));
  const list = extractGrades(parsed);
  if (list.length === 0) {
    throw new Error(
      `flybridge-ielts-judge returned an invalid result: ${full.slice(0, 600)}`
    );
  }
  return list;
}

/**
 * Grades every question; if the model skips any, retry once with only the
 * missing questions so the student always gets feedback for all of them.
 */
async function runJudgeWithRetry(
  questions: QuizQuestion[],
  answers: Record<string, string>,
  skill: string,
  buildPrompt: (opts: {
    skill: string;
    questions: QuizQuestion[];
    answers: Record<string, string>;
  }) => { system: string; user: string }
): Promise<Record<string, unknown>[]> {
  const { system, user } = buildPrompt({ skill, questions, answers });
  let list = await runJudge(system, user);

  const gradedIds = new Set(list.map((r) => r.questionId));
  const missing = questions.filter((q) => !gradedIds.has(q.id));
  if (missing.length > 0 && missing.length < questions.length) {
    const retryPrompt = buildPrompt({ skill, questions: missing, answers });
    list = list.concat(await runJudge(retryPrompt.system, retryPrompt.user));
  }

  return list;
}

export async function judgeWrittenAnswers(
  questions: QuizQuestion[],
  answers: Record<string, string>,
  skill: string
): Promise<WrittenFeedback[]> {
  const list = await runJudgeWithRetry(questions, answers, skill, buildJudgePrompt);

  return list.map((r) => ({
    questionId: typeof r.questionId === "string" ? r.questionId : "",
    bandScore: clampBand(Number(r.bandScore) || 0),
    feedback: typeof r.feedback === "string" ? r.feedback : "",
    exampleAnswer: typeof r.exampleAnswer === "string" ? r.exampleAnswer : "",
    comparison: typeof r.comparison === "string" ? r.comparison : "",
  }));
}

/* ------------------------------------------------------------------ */
/*  Objective (reading / listening) grading                            */
/* ------------------------------------------------------------------ */

function buildObjectiveJudgePrompt(opts: {
  skill: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
}): { system: string; user: string } {
  const system = [
    "You are flybridge-ielts-judge, the official IELTS grading engine for FlyBridge",
    "Education Group.",
    "",
    `You review IELTS ${opts.skill.toUpperCase()} answers to multiple-choice and`,
    "fill-in-the-blank questions. For each question, explain why the correct answer is",
    "right and compare the student's response to what a band 7 candidate would answer.",
    "",
    "## Output format",
    "Return ONLY a valid JSON object keyed by questionId. No markdown, no explanation,",
    "no preamble.",
    "",
    "Example shape:",
    '{ "q1": { "explanation": "...", "band7Answer": "...", "comparison": "..." },',
    '  "q2": { "explanation": "...", "band7Answer": "...", "comparison": "..." } }',
    "",
    "## Rules",
    "- Keep every field SHORT: 1-2 sentences each, no padding.",
    "- For a correct answer, say what the student did right; for an incorrect one, say",
    "  where they went wrong.",
    "- Review EVERY question in the list. The JSON object MUST contain one entry for",
    "  each question id, keyed by that id.",
    "- Return ONLY the JSON object, nothing else.",
  ].join("\n");

  const reviewedLines = opts.questions
    .map((q) => {
      const answer = (opts.answers[q.id] ?? "").trim();
      const options = q.options?.length
        ? `\nOptions: ${q.options.join(" | ")}`
        : "";
      return [
        `Question ${q.id}: ${q.question}${options}`,
        `Correct answer: ${q.correctAnswer}`,
        `Student answer: ${answer || "(no answer)"}`,
      ].join("\n");
    })
    .join("\n\n");

  const user = [
    `Skill: ${opts.skill.toUpperCase()}`,
    "",
    "## Questions, correct answers, and student answers",
    reviewedLines,
  ].join("\n");

  return { system, user };
}

export async function judgeObjectiveAnswers(
  questions: QuizQuestion[],
  answers: Record<string, string>,
  skill: string
): Promise<ObjectiveFeedback[]> {
  const list = await runJudgeWithRetry(
    questions,
    answers,
    skill,
    buildObjectiveJudgePrompt
  );

  return list.map((r) => ({
    questionId: typeof r.questionId === "string" ? r.questionId : "",
    explanation: typeof r.explanation === "string" ? r.explanation : "",
    band7Answer: typeof r.band7Answer === "string" ? r.band7Answer : "",
    comparison: typeof r.comparison === "string" ? r.comparison : "",
  }));
}
