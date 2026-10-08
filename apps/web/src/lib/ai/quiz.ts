import "server-only";

import { getProvider } from "@/lib/ai/provider";
import { COURSE_CATEGORIES } from "@/lib/course-categories";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type QuizQuestionType =
  | "mcq"
  | "true-false"
  | "fill-blank"
  | "short-answer"
  | "written";

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
  skill?: string | null;
  lessonContent?: string;
  topics?: { description?: string; items?: QuizTopic[] };
};

const ALLOWED_TYPES: QuizQuestionType[] = [
  "mcq",
  "true-false",
  "fill-blank",
  "short-answer",
  "written",
];
const MAX_LESSON_CHARS = 8000;

/** Cheap model for the small quiz jobs — falls back to the main AI model. */
const QUIZ_MODEL = process.env.AI_QUIZ_MODEL || process.env.AI_MODEL || "";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/** True when this lesson should be answered in the student's own words. */
export function isSubjectiveLesson(category: string | null | undefined, skill: string | null | undefined): boolean {
  return category === COURSE_CATEGORIES[0] && (skill === "speaking" || skill === "writing");
}

/**
 * Resolve the lesson's effective IELTS skill. The lesson's own `skill` is the
 * source of truth, but editors often set only the per-topic skill (leaving the
 * lesson skill on the "reading" default), so fall back to the dominant topic
 * skill when the lesson skill is still the default.
 */
export function resolveLessonSkill(
  skill: string | null | undefined,
  topics?: { items?: { skill?: string | null }[] } | null
): string {
  const explicit = (skill ?? "reading").trim();
  if (explicit !== "reading") return explicit;

  const counts = new Map<string, number>();
  for (const t of topics?.items ?? []) {
    const s = (t?.skill ?? "").trim();
    if (s && s !== "reading") counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  if (counts.size === 0) return "reading";

  let dominant = "reading";
  let best = -1;
  for (const [s, n] of counts) {
    if (n > best) {
      best = n;
      dominant = s;
    }
  }
  return dominant;
}

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

const JSON_ONLY = [
  "Return ONLY a valid JSON array. No markdown, no explanation, no preamble.",
].join("\n");

function baseOutputFormat(types: string[], extraKeys: string[]): string {
  return [
    "## Output format",
    JSON_ONLY,
    "Each element must be an object with these exact keys:",
    "",
    '  "id":          a short random string (e.g. "q1", "q2")',
    `  "type":        one of ${types.map((t) => `"${t}"`).join(", ")}`,
    '  "question":    the question text',
    ...extraKeys,
    "",
  ].join("\n");
}

export function buildQuizPrompt(
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  opts: QuizPromptOptions = {}
): { system: string; user: string } {
  const isIelts = opts.category === COURSE_CATEGORIES[0];
  const skill = opts.skill ?? "reading";
  const subjective = isSubjectiveLesson(opts.category, skill);
  const content = (opts.lessonContent ?? "").trim().slice(0, MAX_LESSON_CHARS);
  const topics = formatTopics(opts.topics);

  if (subjective) {
    return buildSubjectivePrompt({
      courseTitle,
      moduleTitle,
      lessonTitle,
      skill,
      content,
      topics,
    });
  }

  // A "general" lesson is mixed content — fall back to the standard quiz shape
  // instead of the IELTS reading/listening MCQ + gap-fill.
  if (isIelts && skill !== "general") {
    return buildIeltsObjectivePrompt({
      courseTitle,
      moduleTitle,
      lessonTitle,
      skill,
      content,
      topics,
    });
  }

  return buildGenericPrompt({
    courseTitle,
    moduleTitle,
    lessonTitle,
    content,
    topics,
  });
}

/* -------------------------- IELTS speaking/writing ----------------- */

function buildSubjectivePrompt(opts: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  skill: string;
  content: string;
  topics: string[];
}): { system: string; user: string } {
  const isSpeaking = opts.skill === "speaking";

  const system = [
    "You are a personal IELTS trainer at FlyBridge Education Group.",
    "",
    "## Your task",
    "Create a focused IELTS practice quiz for a single lesson. The student answers by",
    "writing their response in text, so every question must be one they can answer in a",
    "few written sentences. Match the exact IELTS part/task the lesson covers.",
    isSpeaking
      ? [
          "- This is a SPEAKING lesson. Read the lesson title and topics to decide which",
          "  part of the IELTS Speaking test it covers, then generate that part's questions:",
          "  - Part 1: short, personal, everyday questions an examiner asks at the start.",
          "  - Part 2: a cue-card style long-turn prompt (topic plus bullet points to talk",
          "    about).",
          "  - Part 3: abstract discussion questions that follow up on Part 2.",
          "  - If the part is unclear, default to Part 1.",
        ].join("\n")
      : [
          "- This is a WRITING lesson. Read the lesson title and topics to decide which",
          "  IELTS Writing task it covers, then generate that task's prompts:",
          "  - Task 1 (Academic): describe a chart, graph, table or diagram.",
          "  - Task 1 (General Training): a letter prompt (formal/informal).",
          "  - Task 2: an essay question (opinion / discussion / problem-solution etc).",
          "  - If the task is unclear, default to Task 2.",
        ].join("\n"),
    "",
    baseOutputFormat(
      ["written"],
      [
        '  (for type "written": no "options", no "correctAnswer", no "explanation")',
      ]
    ),
    "## Quiz composition",
    "- Generate exactly 1 question.",
    "- Make it a clear, self-contained prompt.",
    "- Base the question on the lesson content, title and topics when provided; never on",
    "  general knowledge.",
    "",
    "## Rules",
    "- Questions must be answerable from the student's own knowledge and experience.",
    "- Use clear, concise language appropriate for IELTS students.",
    "- Return ONLY the JSON array, nothing else.",
  ].join("\n");

  const user = [
    `Course: ${opts.courseTitle}`,
    `Module: ${opts.moduleTitle}`,
    `Lesson: ${opts.lessonTitle}`,
    `Skill: ${opts.skill}`,
    "",
    ...opts.topics,
    ...(opts.content
      ? ["## Lesson text", opts.content, ""]
      : []),
    `Generate exactly 1 ${isSpeaking ? "IELTS Speaking" : "IELTS Writing"} question that matches the part/task covered by this lesson.`,
  ].join("\n");

  return { system, user };
}

/* ----------------------- IELTS reading/listening ------------------- */

function buildIeltsObjectivePrompt(opts: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  skill: string;
  content: string;
  topics: string[];
}): { system: string; user: string } {
  const system = [
    "You are a personal IELTS trainer at FlyBridge Education Group.",
    "",
    "## Your task",
    "Create a focused IELTS practice quiz for a single lesson. Use only multiple-choice",
    'and fill-in-the-blank questions that test THIS lesson\'s reading or listening focus.',
    "",
    baseOutputFormat(
      ["mcq", "fill-blank"],
      [
        '  "options":     an array of answer strings (ONLY for type "mcq", omit for fill-blank)',
        '  "correctAnswer": the correct answer (for mcq use the exact option text, for',
        "                  fill-blank the exact missing word/phrase)",
        '  "explanation": a 1-2 sentence explanation of the correct answer',
      ]
    ),
    "## Quiz composition",
    "- Generate exactly 5 questions: 3 of type \"mcq\" and 2 of type \"fill-blank\".",
    "- For fill-blank questions, put ___ where the blank is in the question text and make",
    "  the correctAnswer the exact missing word/phrase.",
    "- Base every question on the lesson content or topics, never on general knowledge.",
    "",
    "## Rules",
    "- Questions must be answerable from the provided lesson text/topics alone.",
    "- The correctAnswer for mcq must exactly match one of the options.",
    "- Keep explanations factual and helpful, and short.",
    "- Return ONLY the JSON array, nothing else.",
  ].join("\n");

  const user = [
    `Course: ${opts.courseTitle}`,
    `Module: ${opts.moduleTitle}`,
    `Lesson: ${opts.lessonTitle}`,
    `Skill: ${opts.skill}`,
    "",
    ...opts.topics,
    ...(opts.content
      ? ["## Lesson text", opts.content, ""]
      : []),
    "Generate exactly 5 IELTS practice questions for this lesson: 3 multiple-choice (type \"mcq\") and 2 fill-in-the-blank (type \"fill-blank\").",
  ].join("\n");

  return { system, user };
}

/* ----------------------------- Non-IELTS --------------------------- */

function buildGenericPrompt(opts: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  content: string;
  topics: string[];
}): { system: string; user: string } {
  const system = [
    "You are a quiz generator for FlyBridge Education Group — an education company",
    "that helps international students study, work and build a career abroad.",
    "",
    "## Your task",
    "Generate a short quiz based on the lesson described below.",
    "",
    baseOutputFormat(
      ["mcq", "true-false", "short-answer"],
      [
        '  "options":     an array of answer strings (ONLY for type "mcq", omit for others)',
        '  "correctAnswer": the correct answer (for mcq use the exact option text, for true-false use "True" or "False", for short-answer a short reference answer)',
        '  "explanation": a 1-2 sentence explanation of the correct answer',
      ]
    ),
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
    `Course: ${opts.courseTitle}`,
    `Module: ${opts.moduleTitle}`,
    `Lesson: ${opts.lessonTitle}`,
    "",
  ];
  if (opts.content) {
    userLines.push("## Lesson text", opts.content, "");
  }
  userLines.push(...opts.topics);
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
  // The model occasionally wraps the JSON in prose (or returns a single object
  // instead of an array when asked for one question). Extract the outermost JSON
  // value so JSON.parse gets a clean payload.
  const arrayStart = s.indexOf("[");
  const objectStart = s.indexOf("{");
  if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
    const lastBracket = s.lastIndexOf("]");
    if (lastBracket > arrayStart) s = s.slice(arrayStart, lastBracket + 1);
  } else if (objectStart !== -1) {
    const lastBrace = s.lastIndexOf("}");
    if (lastBrace > objectStart) s = s.slice(objectStart, lastBrace + 1);
  }
  return s.trim();
}

/** Maps common model spellings to the canonical question type. */
function normalizeType(raw: string): QuizQuestionType {
  const t = raw.toLowerCase().replace(/[\s_]/g, "-");
  if (t === "fill-in-the-blank" || t === "fill-blank" || t === "gap-fill") {
    return "fill-blank";
  }
  if (t === "multiple-choice" || t === "multiple-choice-question" || t === "mcq") {
    return "mcq";
  }
  if (t === "true-false" || t === "true-or-false" || t === "tf") {
    return "true-false";
  }
  if (t === "short-answer" || t === "short-answer-question") {
    return "short-answer";
  }
  if (t === "written" || t === "essay" || t === "writing") {
    return "written";
  }
  return raw as QuizQuestionType;
}

function sanitizeQuestions(raw: unknown): QuizQuestion[] {
  let list: unknown[];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    const nested = rec.questions ?? rec.quiz ?? rec.data;
    list = Array.isArray(nested) ? nested : [raw];
  } else {
    throw new Error("AI returned invalid quiz data");
  }

  const cleaned: QuizQuestion[] = [];
  for (const q of list) {
    if (!q || typeof q !== "object") continue;
    const rec = q as Record<string, unknown>;
    const rawType = rec.type;
    if (typeof rawType !== "string") continue;
    const type = normalizeType(rawType);
    if (!ALLOWED_TYPES.includes(type)) continue;
    if (typeof rec.id !== "string" || typeof rec.question !== "string") continue;

    if (type === "written") {
      cleaned.push({
        id: rec.id,
        type,
        question: rec.question,
        correctAnswer: "",
        explanation: "",
      });
      continue;
    }

    if (typeof rec.correctAnswer !== "string") continue;
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

  return sanitizeQuestions(JSON.parse(stripCodeFences(full)));
}
