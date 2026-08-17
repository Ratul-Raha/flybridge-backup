import "server-only";

import { getProvider } from "@/lib/ai/provider";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type QuizQuestionType = "mcq" | "true-false" | "short-answer";

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

export function buildQuizPrompt(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string
): { system: string; user: string } {
  const system = [
    "You are a quiz generator for FlyBridge Education Group — an education company",
    "that helps international students study, work and build a career abroad.",
    "",
    "## Your task",
    "Generate a short quiz based on the lesson described below.",
    "",
    "## Output format",
    "Return ONLY a valid JSON array. No markdown, no explanation, no preamble.",
    "Each element must be an object with these exact keys:",
    '',
    '  "id":          a short random string (e.g. "q1", "q2")',
    '  "type":        one of "mcq", "true-false", "short-answer"',
    '  "question":    the question text',
    '  "options":     an array of 4 answer strings (ONLY for type "mcq", omit for others)',
    '  "correctAnswer": the correct answer (for mcq use the exact option text, for true-false use "True" or "False", for short-answer a short reference answer)',
    '  "explanation": a 1-2 sentence explanation of the correct answer',
    "",
    "## Quiz composition",
    "- Generate exactly 5 questions.",
    "- 2 questions of type \"mcq\" (4 options each, one correct).",
    "- 2 questions of type \"true-false\".",
    "- 1 question of type \"short-answer\".",
    "",
    "## Rules",
    "- Questions should test comprehension of the lesson topic, not trivia.",
    "- Use clear, concise language appropriate for international students.",
    "- The correctAnswer for mcq must exactly match one of the options.",
    "- Keep explanations factual and helpful.",
    "- Return ONLY the JSON array, nothing else.",
  ].join("\n");

  const user = [
    `Course: ${courseTitle}`,
    `Module: ${moduleTitle}`,
    `Lesson: ${lessonTitle}`,
    "",
    "Generate a 5-question quiz for this lesson.",
  ].join("\n");

  return { system, user };
}

/* ------------------------------------------------------------------ */
/*  Generation                                                         */
/* ------------------------------------------------------------------ */

function stripCodeFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return s.trim();
}

export async function generateQuiz(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string
): Promise<QuizQuestion[]> {
  const { system, user } = buildQuizPrompt(courseTitle, moduleTitle, lessonTitle);

  const provider = await getProvider();
  const stream = await provider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system,
    messages: [{ role: "user", content: user }],
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

  const parsed = JSON.parse(stripCodeFences(full)) as QuizQuestion[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI returned invalid quiz data");
  }

  return parsed;
}
