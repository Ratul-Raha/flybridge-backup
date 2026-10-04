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
    "Return ONLY a valid JSON array. No markdown, no explanation, no preamble.",
    "Each element must be an object with these exact keys:",
    "",
    '  "questionId":    the id of the question you are grading',
    '  "bandScore":     band for THIS answer (0-9 · 0.5 steps, e.g. 6.5)',
    '  "feedback":      1-2 short sentences on mistakes and how to improve',
    '  "exampleAnswer": a concise band 7 model answer for this question',
    '  "comparison":    1 short sentence comparing the student\'s answer to the band 7 example',
    "",
    "## Rules",
    "- Be strict and realistic; a typical learner lands between 5.0 and 7.5.",
    "- Band must be in 0.5 increments (no 6.25 etc).",
    "- Keep every field SHORT: feedback and comparison must stay to 1-2 sentences, and",
    "  exampleAnswer to a few sentences. Do not pad.",
    "- Grade every question in the list, in the same order.",
    "- Return ONLY the JSON array, nothing else.",
  ].join("\n");

  const gradedLines = opts.questions
    .map((q) => {
      const answer = (opts.answers[q.id] ?? "").trim();
      return [
        `Question ${q.id}: ${q.question}`,
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

/* ------------------------------------------------------------------ */
/*  Grading                                                            */
/* ------------------------------------------------------------------ */

export async function judgeWrittenAnswers(
  questions: QuizQuestion[],
  answers: Record<string, string>,
  skill: string
): Promise<WrittenFeedback[]> {
  const provider = await getProvider();
  const { system, user } = buildJudgePrompt({ skill, questions, answers });

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
  if (!Array.isArray(parsed)) {
    throw new Error("flybridge-ielts-judge returned an invalid result");
  }

  return (parsed as Record<string, unknown>[]).map((r) => ({
    questionId: typeof r.questionId === "string" ? r.questionId : "",
    bandScore: clampBand(Number(r.bandScore) || 0),
    feedback: typeof r.feedback === "string" ? r.feedback : "",
    exampleAnswer: typeof r.exampleAnswer === "string" ? r.exampleAnswer : "",
    comparison: typeof r.comparison === "string" ? r.comparison : "",
  }));
}
