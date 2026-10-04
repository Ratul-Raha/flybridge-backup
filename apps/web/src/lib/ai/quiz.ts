import "server-only";

import { getProvider } from "@/lib/ai/provider";
import { COURSE_CATEGORIES } from "@/lib/course-categories";

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

export type QuizTopic = {
  skill?: string;
  text: string;
};

export type QuizPromptOptions = {
  category?: string | null;
  lessonContent?: string;
  topics?: { description?: string; items?: QuizTopic[] };
};

const ALLOWED_TYPES: QuizQuestionType[] = ["mcq", "true-false", "short-answer"];
const MAX_LESSON_CHARS = 8000;

function formatTopics(topics?: QuizPromptOptions["topics"]): string[] {
  const description = (topics?.description ?? "").trim();
  const items = (topics?.items ?? []).filter((t) => t.text.trim());
  if (!description && items.length === 0) return [];

  const lines: string[] = ["## Lesson topics"];
  if (description) {
    lines.push(description);
    lines.push("");
  }
  for (const t of items) {
    lines.push(`- ${t.skill ?? "reading"}: ${t.text}`);
  }
  lines.push("");
  return lines;
}

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

export function buildQuizPrompt(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  opts: QuizPromptOptions = {}
): { system: string; user: string } {
  const isIelts = opts.category === COURSE_CATEGORIES[0];
  const content = (opts.lessonContent ?? "").trim().slice(0, MAX_LESSON_CHARS);
  const topics = formatTopics(opts.topics);

  const outputFormat = [
    "## Output format",
    "Return ONLY a valid JSON array. No markdown, no explanation, no preamble.",
    "Each element must be an object with these exact keys:",
    '',
    '  "id":          a short random string (e.g. "q1", "q2")',
    '  "type":        one of "mcq", "true-false", "short-answer"',
    '  "question":    the question text',
    '  "options":     an array of answer strings (ONLY for type "mcq", omit for others)',
    '  "correctAnswer": the correct answer (for mcq use the exact option text, for true-false use "True" or "False", for short-answer a short reference answer)',
    '  "explanation": a 1-2 sentence explanation of the correct answer',
    "",
  ].join("\n");

  if (isIelts) {
    const system = [
      "You are a personal IELTS trainer at FlyBridge Education Group.",
      "",
      "## Your task",
      "Create a focused IELTS practice quiz for a single lesson. The quiz must match what the",
      "lesson actually teaches and give the student real exam-style practice on that specific",
      "task or skill.",
      "",
      "## Supported question types",
      "Use ONLY these types:",
      '- "mcq": multiple choice (an "options" array).',
      '- "true-false": a True/False statement.',
      '- "short-answer": a written answer.',
      "",
      "## Quiz composition",
      "- Generate exactly 5 questions.",
      "- The mix of types is NOT fixed. Choose the types that best fit THIS lesson and the",
      "  specific IELTS task it covers (reading, listening, writing or vocabulary). Base every",
      "  question on the lesson content, never on general knowledge.",
      "- For reading lessons:",
      "  * For a true-false-not-given task, use type \"mcq\" with the options exactly",
      "    [\"True\", \"False\", \"Not Given\"] and base each statement on the lesson text.",
      "  * For heading or matching tasks, use type \"mcq\" where the question refers to a",
      "    paragraph, section or item from the lesson and the options are the heading or match",
      "    choices.",
      "  * For other reading tasks, use \"true-false\", \"mcq\" or \"short-answer\" as appropriate.",
      "- For listening or vocabulary lessons, base questions on the lesson content and pick the",
      "  most natural IELTS-style types.",
      "",
      outputFormat,
      "## Rules",
      "- Questions must be answerable from the provided lesson text alone.",
      "- Use clear, concise language appropriate for IELTS students.",
      "- The correctAnswer for mcq must exactly match one of the options.",
      "- Keep explanations factual and helpful.",
      "- Return ONLY the JSON array, nothing else.",
    ].join("\n");

    const user = [
      `Course: ${courseTitle}`,
      `Module: ${moduleTitle}`,
      `Lesson: ${lessonTitle}`,
      "",
      "## Lesson text",
      content
        ? content
        : "(No lesson text was provided. Base the questions on the lesson title and the IELTS",
          "skill or task it suggests, in the student's own best interest.)",
      "",
      ...topics,
      "Generate exactly 5 IELTS practice questions for this lesson, adapted to its focus.",
    ].join("\n");

    return { system, user };
  }

  const system = [
    "You are a quiz generator for FlyBridge Education Group — an education company",
    "that helps international students study, work and build a career abroad.",
    "",
    "## Your task",
    "Generate a short quiz based on the lesson described below.",
    "",
    outputFormat,
    "## Quiz composition",
    "- Generate exactly 5 questions.",
    '- 2 questions of type "mcq" (4 options each, one correct).',
    '- 2 questions of type "true-false".',
    '- 1 question of type "short-answer".',
    "",
    "## Rules",
    "- Questions should test comprehension of the lesson topic, not trivia.",
    "- Use clear, concise language appropriate for international students.",
    "- The correctAnswer for mcq must exactly match one of the options.",
    "- Keep explanations factual and helpful.",
    "- Return ONLY the JSON array, nothing else.",
  ].join("\n");

  const userLines = [
    `Course: ${courseTitle}`,
    `Module: ${moduleTitle}`,
    `Lesson: ${lessonTitle}`,
    "",
  ];
  if (content) {
    userLines.push("## Lesson text", content, "");
  }
  userLines.push(...topics);
  userLines.push("Generate a 5-question quiz for this lesson.");

  return { system, user: userLines.join("\n") };
}

/* ------------------------------------------------------------------ */
/*  Generation                                                          */
/* ------------------------------------------------------------------ */

function stripCodeFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return s.trim();
}

function sanitizeQuestions(raw: unknown): QuizQuestion[] {
  if (!Array.isArray(raw)) {
    throw new Error("AI returned invalid quiz data");
  }

  const cleaned: QuizQuestion[] = [];
  for (const q of raw) {
    if (!q || typeof q !== "object") continue;
    const rec = q as Record<string, unknown>;
    const type = rec.type;
    if (typeof type !== "string" || !ALLOWED_TYPES.includes(type as QuizQuestionType)) continue;
    if (
      typeof rec.id !== "string" ||
      typeof rec.question !== "string" ||
      typeof rec.correctAnswer !== "string"
    ) {
      continue;
    }
    cleaned.push({
      id: rec.id,
      type: type as QuizQuestionType,
      question: rec.question,
      options: Array.isArray(rec.options) ? rec.options.map(String) : undefined,
      correctAnswer: rec.correctAnswer,
      explanation: typeof rec.explanation === "string" ? rec.explanation : "",
    });
  }

  if (cleaned.length === 0) {
    throw new Error("AI returned invalid quiz data");
  }
  return cleaned;
}

export async function generateQuiz(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  opts: QuizPromptOptions = {}
): Promise<QuizQuestion[]> {
  const { system, user } = buildQuizPrompt(courseTitle, moduleTitle, lessonTitle, opts);

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

  return sanitizeQuestions(JSON.parse(stripCodeFences(full)));
}