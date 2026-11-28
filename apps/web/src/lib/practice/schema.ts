export const PRACTICE_CATEGORY = "IELTS";

export const PRACTICE_MODULES = ["reading", "listening", "writing", "speaking"] as const;
export type PracticeModule = (typeof PRACTICE_MODULES)[number];

export const PRACTICE_MODULE_LABELS: Record<PracticeModule, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export const PRACTICE_GENERIC_TYPES = ["mcq", "true-false", "fill-blank", "short-answer", "written"];

export const PRACTICE_SET_STATUSES = ["draft", "published", "archived"] as const;
export type PracticeSetStatus = (typeof PRACTICE_SET_STATUSES)[number];

export const PRACTICE_QUESTION_TYPES: Record<PracticeModule, string[]> = {
  reading: [
    "multiple-choice",
    "true-false-ng",
    "heading-matching",
    "matching-features",
    "sentence-completion",
    "summary-completion",
    "notes-completion",
    "form-completion",
    "table-completion",
    "diagram-completion",
    "fill-in-the-blanks",
    "fill-in-blank",
    "short-answer",
  ],
  listening: [
    "multiple-choice",
    "matching",
    "plan-map-labelling",
    "diagram-labelling",
    "flow-chart-completion",
    "form-completion",
    "notes-completion",
    "table-completion",
    "sentence-completion",
    "summary-completion",
    "fill-in-the-blanks",
    "fill-in-blank",
    "short-answer",
  ],
  writing: ["task-1", "task-2"],
  speaking: ["part-1", "part-2", "part-3"],
};

const CHOICE_TYPES = new Set([
  "multiple-choice",
  "true-false-ng",
  "heading-matching",
  "matching-features",
  "matching",
  "mcq",
]);

export function allowedPracticeTypes(module: string): string[] {
  return module in PRACTICE_QUESTION_TYPES
    ? PRACTICE_QUESTION_TYPES[module as PracticeModule]
    : PRACTICE_GENERIC_TYPES;
}

export type PracticePassage = {
  id: string;
  title?: string;
  text: string;
};

export type PracticeAudio = {
  url?: string;
  transcript?: string;
};

export type PracticeQuestion = {
  id: string;
  type: string;
  question: string;
  passageId?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  chart?: unknown;
};

export type PracticeSetContent = {
  version?: number;
  module?: string;
  title?: string;
  instructions?: string;
  passages?: PracticePassage[];
  audios?: Record<string, PracticeAudio>;
  questions: PracticeQuestion[];
};

export type PublicPracticeQuestion = Omit<PracticeQuestion, "correctAnswer" | "explanation">;

export type PublicPracticeSetContent = Omit<PracticeSetContent, "questions"> & {
  questions: PublicPracticeQuestion[];
};

export function stripPracticeAnswers(
  content: PracticeSetContent
): PublicPracticeSetContent {
  return {
    ...content,
    questions: content.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      ...(q.passageId ? { passageId: q.passageId } : {}),
      ...(q.options ? { options: q.options } : {}),
      ...(q.chart ? { chart: q.chart } : {}),
    })),
  };
}

export type PracticeValidationReport = {
  passageCount: number;
  questionCount: number;
  typeCounts: Record<string, number>;
  errors: string[];
  warnings: string[];
};

export type PracticeSetDto = {
  id: string;
  course: string;
  courseSlug: string;
  courseTitle: string;
  category: string | null;
  moduleIndex: number;
  lessonIndex: number | null;
  skill: string;
  setNumber: number;
  title: string;
  status: PracticeSetStatus;
  fileName: string;
  s3Key: string;
  questionCount: number;
  passageCount: number;
  typeCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

export type StudentPracticeSetDto = Omit<PracticeSetDto, "s3Key" | "fileName">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function validatePracticeContent(
  raw: unknown,
  skill: string
): { content: PracticeSetContent; report: PracticeValidationReport } {
  if (!isRecord(raw)) throw new Error("JSON root must be an object");
  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    throw new Error("JSON must contain a non-empty \"questions\" array");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const allowedTypes = new Set(allowedPracticeTypes(skill));

  const passages: PracticePassage[] = [];
  const passageIds = new Set<string>();
  if (raw.passages !== undefined && !Array.isArray(raw.passages)) {
    errors.push("\"passages\" must be an array");
  } else if (Array.isArray(raw.passages)) {
    raw.passages.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`Passage ${index + 1} must be an object`);
        return;
      }
      const id = str(item.id);
      const text = typeof item.text === "string" ? item.text : "";
      if (!id) errors.push(`Passage ${index + 1} has no id`);
      if (!text.trim()) errors.push(`Passage ${id || index + 1} has no text`);
      if (passageIds.has(id)) errors.push(`Duplicate passage id: ${id}`);
      passageIds.add(id);
      passages.push({
        id,
        title: str(item.title),
        text,
      });
    });
  }

  const audios: Record<string, PracticeAudio> = {};
  if (isRecord(raw.audios)) {
    for (const [key, value] of Object.entries(raw.audios)) {
      if (!isRecord(value)) continue;
      audios[key] = { url: str(value.url), transcript: str(value.transcript) };
    }
  }

  const questions: PracticeQuestion[] = [];
  const questionIds = new Set<string>();
  const typeCounts: Record<string, number> = {};
  const needsPassage = skill === "reading" || skill === "listening";

  raw.questions.forEach((item, index) => {
    const label = `Question ${index + 1}`;
    if (!isRecord(item)) {
      errors.push(`${label} must be an object`);
      return;
    }
    const id = str(item.id);
    const type = str(item.type);
    const question = str(item.question);
    const passageId = str(item.passageId);
    const options = stringList(item.options);
    const correctAnswer = str(item.correctAnswer);
    const explanation = str(item.explanation);

    if (!id) errors.push(`${label} has no id`);
    else if (questionIds.has(id)) errors.push(`Duplicate question id: ${id}`);
    questionIds.add(id);
    if (!question) errors.push(`${id || label} has no question text`);

    if (!type) errors.push(`${id || label} has no type`);
    else if (!allowedTypes.has(type)) {
      errors.push(`${id || label} has unsupported type "${type}" for ${skill}`);
    } else {
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    }

    if (needsPassage) {
      if (!passageId) warnings.push(`${id || label} has no passageId`);
      else if (passages.length > 0 && !passageIds.has(passageId)) {
        errors.push(`${id || label} references unknown passage "${passageId}"`);
      }
    }

    if (CHOICE_TYPES.has(type)) {
      if (options.length < 2) errors.push(`${id || label} needs at least 2 options`);
      if (!correctAnswer) errors.push(`${id || label} has no correctAnswer`);
      else if (options.length > 0 && !options.includes(correctAnswer)) {
        errors.push(`${id || label} correctAnswer must exactly match one of its options`);
      }
    } else if (needsPassage && !correctAnswer) {
      errors.push(`${id || label} has no correctAnswer`);
    }

    if (!explanation) warnings.push(`${id || label} has no explanation`);

    questions.push({
      id,
      type,
      question,
      ...(passageId ? { passageId } : {}),
      ...(item.options !== undefined ? { options } : {}),
      ...(correctAnswer ? { correctAnswer } : {}),
      ...(explanation ? { explanation } : {}),
      ...(isRecord(item.chart) ? { chart: item.chart } : {}),
    });
  });

  return {
    content: {
      ...(typeof raw.version === "number" ? { version: raw.version } : {}),
      ...(str(raw.module) ? { module: str(raw.module) } : {}),
      ...(str(raw.title) ? { title: str(raw.title) } : {}),
      ...(str(raw.instructions) ? { instructions: str(raw.instructions) } : {}),
      ...(passages.length ? { passages } : {}),
      ...(Object.keys(audios).length ? { audios } : {}),
      questions,
    },
    report: {
      passageCount: passages.length,
      questionCount: questions.length,
      typeCounts,
      errors,
      warnings,
    },
  };
}

export function formatTypeLabel(type: string): string {
  return type
    .split("-")
    .map((part) => (part === "ng" ? "(NG)" : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}
