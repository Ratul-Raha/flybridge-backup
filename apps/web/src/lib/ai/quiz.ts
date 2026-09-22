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

export type QuizPromptOptions = {
  category?: string | null;
  lessonContent?: string;
};

const ALLOWED_TYPES: QuizQuestionType[] = ["mcq", "true-false", "short-answer"];
const MAX_LESSON_CHARS = 8000;

/* ------------------------------------------------------------------ */
/*  IELTS task detection                                               */
/* ------------------------------------------------------------------ */

export type IeltsSkill =
  | "reading"
  | "writing"
  | "listening"
  | "speaking"
  | "general";

export type IeltsFocus = {
  skill: IeltsSkill;
  plan: string;
};

export function detectIeltsFocus(
  moduleTitle: string,
  lessonTitle: string
): IeltsFocus {
  const mod = moduleTitle.toLowerCase();
  const lesson = lessonTitle.toLowerCase();
  const any = (...words: string[]) =>
    words.some((w) => `${mod} ${lesson}`.includes(w.toLowerCase()));
  const hasMod = (...words: string[]) =>
    words.some((w) => mod.includes(w.toLowerCase()));
  const hasLesson = (...words: string[]) =>
    words.some((w) => lesson.includes(w.toLowerCase()));

  let skill: IeltsSkill;
  if (hasMod("reading")) skill = "reading";
  else if (hasMod("writing")) skill = "writing";
  else if (hasMod("listening")) skill = "listening";
  else if (hasMod("speaking")) skill = "speaking";
  else if (
    any("true/false", "not given", "heading", "skimm", "paragraph", "match")
  )
    skill = "reading";
  else if (any("writing", "task 1", "task 2", "essay", "letter", "graph"))
    skill = "writing";
  else if (
    any("listening", "section", "accent", "distractor", "spelling", "map")
  )
    skill = "listening";
  else skill = "speaking";

  switch (skill) {
    case "reading": {
      if (
        hasLesson("true/false", "true-false", "true", "false", "not given")
      ) {
        return {
          skill,
          plan:
            "This is a True / False / Not Given reading lesson. Generate each statement as type " +
            '"mcq" with the options exactly ["True", "False", "Not Given"] and base each statement ' +
            "on the lesson text. The correctAnswer must be one of those three options.",
        };
      }
      if (hasLesson("heading", "match", "feature", "sentence end")) {
        return {
          skill,
          plan:
            "This is a matching / headings reading lesson. Use \"mcq\" questions where each question " +
            "refers to a paragraph, section or item from the lesson text and the options are the " +
            "heading or match choices.",
        };
      }
      if (hasLesson("summary", "completion", "gap", "word limit")) {
        return {
          skill,
          plan:
            "This is a summary / gap-fill completion reading lesson. Test exact-word rules and word " +
            "limits. Prefer \"short-answer\" and \"mcq\". Avoid \"true-false\".",
        };
      }
      return {
        skill,
        plan:
          "This is an IELTS Reading lesson. Use whichever of \"true-false\", \"mcq\" or " +
          "\"short-answer\" best fits the specific reading task; base every question on the lesson " +
          "text, never on general knowledge.",
      };
    }

    case "writing": {
      if (
        hasLesson("task 1", "letter", "graph", "bar", "line", "chart", "table", "process") &&
        !hasLesson("task 2")
      ) {
        return {
          skill,
          plan:
            "This is an IELTS Writing Task 1 lesson (data description, a process, or a letter). Test " +
            "the student's understanding of the task and structure: the overview, data selection and " +
            "comparison, accurate summarising, or the correct letter tone and format (formal / " +
            "semi-formal / informal). Prefer \"mcq\" and \"short-answer\". Only use \"true-false\" if " +
            "a true/false statement genuinely tests that content.",
        };
      }
      return {
        skill,
        plan:
          "This is an IELTS Writing Task 2 lesson (planning and essay writing). Test the student's " +
          "understanding of essay structure and technique: the position/thesis, topic sentences, " +
          "paragraphing, cohesion and linking devices, paraphrasing the prompt, and common band-6 " +
          "mistakes. Prefer \"mcq\" and \"short-answer\". Only use \"true-false\" if a true/false " +
          "statement genuinely tests the writing content.",
      };
    }

    case "listening": {
      if (hasLesson("form", "map", "number", "name", "spelling", "location")) {
        return {
          skill,
          plan:
            "This is an IELTS Listening lesson about form / map / plan completion. Test the student's " +
            "ability to catch precise details: numbers, names, spellings and locations. Prefer " +
            "\"short-answer\" (exact word/number capture) plus \"mcq\". Avoid \"true-false\".",
        };
      }
      if (hasLesson("multiple choice", "matching", "monologue", "accent")) {
        return {
          skill,
          plan:
            "This is an IELTS Listening lesson about multiple choice, matching or section 3/4 " +
            "monologues. Use \"mcq\" questions about the task and strategies from the lesson. Avoid " +
            "\"true-false\".",
        };
      }
      return {
        skill,
        plan:
          "This is an IELTS Listening lesson. Base questions on the listening task, strategies or " +
          "material in the lesson. Use \"mcq\" and \"short-answer\". Avoid \"true-false\" unless a " +
          "true/false statement genuinely tests the listening content.",
      };
    }

    default: {
      if (hasLesson("cue card", "part 2")) {
        return {
          skill,
          plan:
            "This is an IELTS Speaking Part 2 (cue card) lesson. Use \"short-answer\" to test what the " +
            "student should include in the 1-minute preparation and the 2-minute speech, plus \"mcq\" " +
            "for structure or band-descriptor ideas. Avoid \"true-false\".",
        };
      }
      if (hasLesson("part 1")) {
        return {
          skill,
          plan:
            "This is an IELTS Speaking Part 1 lesson. Use \"mcq\" and \"short-answer\" to test how to " +
            "answer promptly and extend answers naturally without going off-topic. Avoid " +
            "\"true-false\".",
        };
      }
      if (hasLesson("part 3", "prep", "abstract", "reasoning")) {
        return {
          skill,
          plan:
            "This is an IELTS Speaking Part 3 (abstract reasoning / PREP method) lesson. Use \"mcq\" " +
            "and \"short-answer\" to test the PREP structure and giving opinions with reasons. Avoid " +
            "\"true-false\".",
        };
      }
      return {
        skill,
        plan:
          "This is an IELTS Speaking lesson. Test speaking technique from the lesson (e.g. answering " +
          "promptly, extending answers, avoiding hesitation and self-correction) with \"mcq\" and " +
          "\"short-answer\". Avoid \"true-false\" unless a true/false statement genuinely tests the " +
          "speaking content.",
      };
    }
  }
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
    const focus = detectIeltsFocus(moduleTitle, lessonTitle);

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
      "- The mix of types is NOT fixed and there is no required balance. Choose ONLY the types",
      "  that genuinely fit THIS lesson and the specific IELTS task it covers (reading,",
      "  listening, speaking, writing or vocabulary). A quiz may legitimately have 0 of a given",
      "  type. Base every question on the lesson content, never on general knowledge.",
      "- The user message contains a section \"This lesson's IELTS focus\" describing THIS lesson's",
      "  task. Follow that focus plan above all other type guidance — it decides which question",
      "  types to use. Never default to a fixed mix (a lesson is not a 2-2-1 generic quiz).",
      "- For reading lessons:",
      "  * For a true-false-not-given task, use type \"mcq\" with the options exactly",
      "    [\"True\", \"False\", \"Not Given\"] and base each statement on the lesson text.",
      "  * For heading or matching tasks, use type \"mcq\" where the question refers to a",
      "    paragraph, section or item from the lesson and the options are the heading or match",
      "    choices.",
      "  * For other reading tasks, use \"true-false\", \"mcq\" or \"short-answer\" as appropriate.",
      "- For writing lessons (e.g. Task 1 or Task 2), test writing skills: understanding the task",
      "  type/requirements, paraphrasing the prompt, essay or letter structure (introduction,",
      "  body, conclusion), band-descriptor ideas and common mistakes. Prefer \"mcq\" and",
      "  \"short-answer\". Only use \"true-false\" if a true/false statement genuinely tests the",
      "  writing content.",
      "- For speaking lessons, test the specific technique the lesson teaches (answering promptly,",
      "  extending answers, cue-card timing, the PREP method, avoiding hesitation) with \"mcq\" and",
      "  \"short-answer\".",
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
      "## This lesson's IELTS focus",
      focus.plan,
      "",
      "## Lesson text",
      content
        ? content
        : "(No lesson text was provided. Base the questions on the lesson title and the IELTS",
          "skill or task it suggests, in the student's own best interest.)",
      "",
      "Generate exactly 5 IELTS practice questions for this lesson, following the focus plan above.",
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