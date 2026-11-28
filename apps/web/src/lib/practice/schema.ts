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
    "true-false-not-given",
    "yes-no-not-given",
    "heading-matching",
    "matching-headings",
    "matching-features",
    "matching-information",
    "matching-sentence-endings",
    "sentence-completion",
    "summary-completion",
    "notes-completion",
    "form-completion",
    "table-completion",
    "flow-chart-completion",
    "diagram-completion",
    "diagram-label-completion",
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
  "true-false-not-given",
  "yes-no-not-given",
  "heading-matching",
  "matching-headings",
  "matching-features",
  "matching-information",
  "matching-sentence-endings",
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
  instructions?: string;
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
  acceptedAnswers?: string[];
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

export type PublicPracticeQuestion = Omit<
  PracticeQuestion,
  "correctAnswer" | "acceptedAnswers" | "explanation"
>;

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
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

type SectionOption = { id: string; text: string };

function sectionOptions(value: unknown): SectionOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (isRecord(item)) {
        const id = str(item.id) || str(item.label) || String.fromCharCode(65 + index);
        return { id, text: str(item.text) || id };
      }
      const text = str(item);
      return { id: String.fromCharCode(65 + index), text };
    })
    .filter((option) => Boolean(option.id || option.text));
}

function matchAnswer(value: unknown, options: SectionOption[]): string {
  const answer = str(value);
  if (!answer) return "";
  const matched = options.find(
    (option) =>
      option.id.toLowerCase() === answer.toLowerCase() ||
      option.text.toLowerCase() === answer.toLowerCase()
  );
  return matched ? matched.text : answer;
}

function sectionChoiceOptions(section: Record<string, unknown>, type: string): SectionOption[] {
  if (type === "true-false-not-given") {
    return [
      { id: "TRUE", text: "TRUE" },
      { id: "FALSE", text: "FALSE" },
      { id: "NOT GIVEN", text: "NOT GIVEN" },
    ];
  }
  if (type === "yes-no-not-given") {
    return [
      { id: "YES", text: "YES" },
      { id: "NO", text: "NO" },
      { id: "NOT GIVEN", text: "NOT GIVEN" },
    ];
  }
  if (type === "matching-headings" || type === "heading-matching") {
    return sectionOptions(section.headings);
  }
  if (type === "matching-features") {
    return sectionOptions(section.features);
  }
  if (type === "matching-sentence-endings") {
    return sectionOptions(section.endings);
  }
  if (type === "summary-completion") {
    return sectionOptions(section.wordBank);
  }
  if (type === "matching-information") {
    const passage = isRecord(section.passage) ? section.passage : {};
    return sectionOptions(passage.paragraphs).map((option) => ({ id: option.id, text: option.id }));
  }
  return [];
}

function answerFrom(
  value: unknown,
  options: SectionOption[]
): { correctAnswer: string; acceptedAnswers: string[] } {
  if (Array.isArray(value)) {
    const answers = stringList(value).map((answer) => matchAnswer(answer, options));
    return { correctAnswer: answers[0] ?? "", acceptedAnswers: answers };
  }
  const answer = matchAnswer(value, options);
  return { correctAnswer: answer, acceptedAnswers: answer ? [answer] : [] };
}

function normalizeSectionBasedContent(raw: Record<string, unknown>): Record<string, unknown> {
  const tests = Array.isArray(raw.tests) ? raw.tests.filter(isRecord) : [];
  const passages: Record<string, unknown>[] = [];
  const questions: Record<string, unknown>[] = [];

  for (const test of tests) {
    const sections = Array.isArray(test.sections) ? test.sections.filter(isRecord) : [];
    for (const section of sections) {
      const sectionId = str(section.id) || `passage-${passages.length + 1}`;
      const passage = isRecord(section.passage) ? section.passage : {};
      const paragraphs = Array.isArray(passage.paragraphs) ? passage.paragraphs : [];
      const labeled = passage.labeled === true;
      const text = paragraphs
        .map((item, index) => {
          if (!isRecord(item)) return "";
          const label = str(item.id) || String.fromCharCode(65 + index);
          const body = str(item.text);
          return labeled ? `${label}\n${body}` : body;
        })
        .filter((part) => part.length > 0)
        .join("\n\n");

      passages.push({
        id: sectionId,
        title: str(passage.title) || str(section.title),
        instructions: str(section.instructions),
        text,
      });

      const type = str(section.type) || "multiple-choice";
      const sharedOptions = sectionChoiceOptions(section, type);
      const sectionQuestions = Array.isArray(section.questions) ? section.questions : [];
      for (const item of sectionQuestions) {
        if (!isRecord(item)) continue;
        const itemOptions = sectionOptions(item.options);
        const options = itemOptions.length > 0 ? itemOptions : sharedOptions;
        const { correctAnswer, acceptedAnswers } = answerFrom(
          item.answer ?? item.correctAnswer,
          options
        );
        const paragraphId = str(item.paragraphId);
        const blank = str(item.blank);
        const prompt =
          str(item.prompt) ||
          str(item.question) ||
          (paragraphId
            ? `Paragraph ${paragraphId}: ${str(section.instructions) || "Choose the correct answer."}`
            : "") ||
          (blank ? `Complete ${blank}. ${str(section.instructions) || ""}`.trim() : "") ||
          str(section.instructions) ||
          "Choose the correct answer";
        questions.push({
          id: str(item.id),
          type,
          question: prompt,
          passageId: sectionId,
          options: options.map((option) => option.text),
          correctAnswer,
          acceptedAnswers,
          explanation: str(item.explanation),
        });
      }
    }
  }

  const versionNumber = Number(str(raw.schemaVersion));
  const firstTest = tests[0];
  return {
    ...(Number.isFinite(versionNumber) && versionNumber > 0 ? { version: versionNumber } : {}),
    ...(str(firstTest?.module) || str(raw.module)
      ? { module: str(firstTest?.module) || str(raw.module) }
      : {}),
    ...(str(firstTest?.title) || str(raw.title)
      ? { title: str(firstTest?.title) || str(raw.title) }
      : {}),
    ...(str(firstTest?.instructions) || str(raw.instructions)
      ? { instructions: str(firstTest?.instructions) || str(raw.instructions) }
      : {}),
    passages,
    questions,
  };
}

export function validatePracticeContent(
  raw: unknown,
  skill: string
): { content: PracticeSetContent; report: PracticeValidationReport } {
  if (!isRecord(raw)) throw new Error("JSON root must be an object");
  const source =
    (!Array.isArray(raw.questions) || raw.questions.length === 0) && Array.isArray(raw.tests)
      ? normalizeSectionBasedContent(raw)
      : raw;
  if (!Array.isArray(source.questions) || source.questions.length === 0) {
    throw new Error("JSON must contain a non-empty \"questions\" array");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const allowedTypes = new Set(allowedPracticeTypes(skill));

  const passages: PracticePassage[] = [];
  const passageIds = new Set<string>();
  if (source.passages !== undefined && !Array.isArray(source.passages)) {
    errors.push("\"passages\" must be an array");
  } else if (Array.isArray(source.passages)) {
    source.passages.forEach((item, index) => {
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
        ...(str(item.instructions) ? { instructions: str(item.instructions) } : {}),
        text,
      });
    });
  }

  const audios: Record<string, PracticeAudio> = {};
  if (isRecord(source.audios)) {
    for (const [key, value] of Object.entries(source.audios)) {
      if (!isRecord(value)) continue;
      audios[key] = { url: str(value.url), transcript: str(value.transcript) };
    }
  }

  const questions: PracticeQuestion[] = [];
  const questionIds = new Set<string>();
  const typeCounts: Record<string, number> = {};
  const needsPassage = skill === "reading" || skill === "listening";

  source.questions.forEach((item, index) => {
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
    const acceptedAnswers = stringList(item.acceptedAnswers);
    let correctAnswer = str(item.correctAnswer);
    if (!correctAnswer && acceptedAnswers.length > 0) correctAnswer = acceptedAnswers[0];
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
      ...(acceptedAnswers.length > 0 ? { acceptedAnswers } : {}),
      ...(explanation ? { explanation } : {}),
      ...(isRecord(item.chart) ? { chart: item.chart } : {}),
    });
  });

  return {
    content: {
      ...(typeof source.version === "number" ? { version: source.version } : {}),
      ...(str(source.module) ? { module: str(source.module) } : {}),
      ...(str(source.title) ? { title: str(source.title) } : {}),
      ...(str(source.instructions) ? { instructions: str(source.instructions) } : {}),
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
