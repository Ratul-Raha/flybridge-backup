import "server-only";

import { getProvider } from "@/lib/ai/provider";
import type { MockTestContentDoc } from "@/lib/models/mock-test";

class StructureError extends Error {}
class NoQuestionsError extends Error {}

export type StructureSkill = "reading" | "listening" | "writing";

const SUPPORTED_QUESTION_TYPES = [
  "multiple-choice",
  "true-false-ng",
  "heading-matching",
  "matching-features",
  "sentence-completion",
  "summary-completion",
  "notes-completion",
  "form-completion",
  "short-answer",
] as const;

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

function skillInstructions(skill: StructureSkill): string {
  if (skill === "reading") {
    return [
      "- The pasted text may contain MULTIPLE reading passages, each followed by",
      "  its own groups of questions. Detect every passage, in the order it appears.",
      "- Put each passage verbatim into the top-level \"passages\" array as",
      "  { \"id\": \"p1\", \"title\": \"Reading Passage 1\", \"text\": \"...\" } (keep the",
      "  passage heading in \"title\"; split paragraphs with a blank line).",
      "- Structure the questions that belong to a passage into \"sections\", and set",
      "  each section's \"passageId\" to the matching passage id so the app can show",
      "  the passage side-by-side with its questions.",
      "- Keep each question's prompt exactly as written in the source (blanks already",
      "  marked with ___ as in the source).",
    ].join("\n");
  }
  if (skill === "listening") {
    return [
      "- Listening is answer-only: leave \"passage\" and \"passages\" empty",
      "  (the audio is attached separately).",
      "- Structure the QUESTIONS into sections (Form/Notes/Table/Completion,",
      "  Multiple Choice, Matching, Plan/Map/Diagram Labelling).",
    ].join("\n");
  }
  return [
    "- WRITING tests have no question sections.",
    "- Put Task 1 into \"writingTask1\" and Task 2 into \"writingTask2\" verbatim.",
    "- Leave \"passage\", \"passages\" and \"sections\" empty.",
  ].join("\n");
}

export function buildStructurePrompt(opts: {
  skill: StructureSkill;
  questionBlob: string;
  answerBlob?: string;
}): { system: string; user: string } {
  const system = [
    "You are the question-structuring engine for FlyBridge IELTS Mock Tests.",
    "You convert raw, admin-pasted IELTS test text into a clean computer-based",
    "test (CBT) structure in JSON. You also SOLVE the questions and store the",
    "correct answers.",
    "",
    "## Supported question types",
    SUPPORTED_QUESTION_TYPES.map((t) => `- ${t}`).join("\n"),
    "",
    "## Output format",
    "Return ONLY a valid JSON object. No markdown, no explanation.",
    'The object must have exactly these keys:',
    '',
    '  "type":         one of "reading" | "listening" | "writing"',
    '  "passages":     array of passage objects (reading only; empty otherwise)',
    '  "sections":     array of section objects',
    '  "writingTask1": string (writing only)',
    '  "writingTask2": string (writing only)',
    '',
    'A passage object:',
    '  { "id": "p1", "title": "Reading Passage 1", "text": "<full verbatim text>" }',
    '',
    'A section object:',
    '  { "id": "s1", "passageId": "p1", "type": "<question type>",',
    '    "instructions": "<section instructions>",',
    '    "questions": [ ...question objects ] }',
    '',
    'A question object:',
    '  { "qid": "q1", "type": "<question type>", "prompt": "<question text, blanks as ___>",',
    '    "options": ["<choice a>", "<choice b>", ...],',
    '    "correctOption": <0-based index of the correct option, or -1>,',
    '    "answer": "<the correct answer as text (for completion/short-answer)>",',
    '    "passageRef": "<optional paragraph reference>",',
    '    "wordHint": "<optional word limit hint (e.g. NO MORE THAN TWO WORDS)>" }',
    "",
    "## Rules",
    skillInstructions(opts.skill),
    "- For \"multiple-choice\", \"true-false-ng\", \"heading-matching\" and",
    "  \"matching-features\", put the choices in \"options\" and set",
    "  \"correctOption\" to the 0-based index of the right choice.",
    "- For true-false-ng the options are exactly [\"True\", \"False\", \"Not Given\"].",
    "- For completion and short-answer questions set \"options\" to [\"\"] and put",
    "  the exact expected words in \"answer\".",
    "- CRITICAL: SOLVE and answer EVERY question. Every question object MUST have its",
    "  correct answer filled in: set \"correctOption\" (0-based) for choice-style",
    "  questions and \"answer\" for completion/short-answer questions. Never leave",
    "  both empty and never use -1.",
    "- The answers section at the end of the user message is the official answer key.",
    "  Read it FIRST: it gives one answer per line as \"<number>. <answer>\". Use it as",
    "  the source of truth and keep the question numbering 1:1 with it. If a question",
    "  number in the test text does not match a key number, still answer it from the",
    "  passage.",
    "- Assign sequential unique \"qid\" values (q1, q2, ...) across the whole test,",
    "  so the number in each \"qid\" equals the question number in the answer key.",
    "- Preserve the original wording of passages and questions exactly; never reword.",
    "- Return ONLY the JSON object, nothing else.",
  ].join("\n");

  const user = [
    `Type: ${opts.skill.toUpperCase()}`,
    "",
    "## Test text (passages and questions)",
    opts.questionBlob.trim(),
    ...(opts.answerBlob?.trim()
      ? ["", "## Answers/answers-key text", opts.answerBlob.trim()]
      : []),
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

async function readFullStream(
  provider: Awaited<ReturnType<typeof getProvider>>,
  opts: { system: string; user: string; maxTokens?: number }
): Promise<string> {
  const stream = await provider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    jsonMode: true,
    maxTokens: opts.maxTokens ?? 8192,
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

  return full;
}

type NormalizedQuestion = {
  qid: string;
  type: string;
  prompt: string;
  options: string[];
  correctOption: number;
  answer: string;
  passageRef: string;
  wordHint: string;
};

type NormalizedSection = {
  id: string;
  passageId: string;
  type: string;
  instructions: string;
  passage: string;
  questions: NormalizedQuestion[];
};

type NormalizedPassage = {
  id: string;
  title: string;
  text: string;
};

function normalizeQuestion(
  q: Record<string, unknown>,
  fallbackId: string
): NormalizedQuestion {
  return {
    qid: typeof q.qid === "string" ? q.qid : fallbackId,
    type: typeof q.type === "string" ? q.type : "short-answer",
    prompt: typeof q.prompt === "string" ? q.prompt : "",
    options: Array.isArray(q.options)
      ? (q.options as unknown[]).filter((o): o is string => typeof o === "string")
      : [],
    correctOption:
      typeof q.correctOption === "number" && q.correctOption >= 0
        ? Math.round(q.correctOption)
        : -1,
    answer:
      typeof q.answer === "string"
        ? q.answer
        : typeof q.correctAnswer === "string"
          ? q.correctAnswer
          : "",
    passageRef: typeof q.passageRef === "string" ? q.passageRef : "",
    wordHint: typeof q.wordHint === "string" ? q.wordHint : "",
  };
}

function normalizePassages(raw: Record<string, unknown>): NormalizedPassage[] {
  if (!Array.isArray(raw.passages)) return [];
  return (raw.passages as unknown[])
    .map((p, pi) => {
      const pas = (p ?? {}) as Record<string, unknown>;
      const text =
        typeof pas.text === "string"
          ? pas.text
          : typeof pas.passage === "string"
            ? pas.passage
            : "";
      return {
        id: typeof pas.id === "string" ? pas.id : `p${pi + 1}`,
        title:
          typeof pas.title === "string" && pas.title.trim()
            ? pas.title
            : `Reading Passage ${pi + 1}`,
        text,
      };
    })
    .filter((p) => p.text.trim().length > 0);
}

function normalizeContent(
  raw: Record<string, unknown>,
  skill: StructureSkill
): MockTestContentDoc {
  const sections: NormalizedSection[] = Array.isArray(raw.sections)
    ? (raw.sections as unknown[])
        .map((s, si) => {
          const sec = (s ?? {}) as Record<string, unknown>;
          const questions = Array.isArray(sec.questions)
            ? (sec.questions as Record<string, unknown>[])
                .filter((q) => q)
                .map((q, qi) =>
                  normalizeQuestion(q, `q${sec.id ?? si + 1}_${qi + 1}`)
                )
            : [];
          return {
            id: typeof sec.id === "string" ? sec.id : `s${si + 1}`,
            passageId: typeof sec.passageId === "string" ? sec.passageId : "",
            type: typeof sec.type === "string" ? sec.type : "short-answer",
            instructions:
              typeof sec.instructions === "string" ? sec.instructions : "",
            passage: typeof sec.passage === "string" ? sec.passage : "",
            questions,
          };
        })
        .filter((s) => s.questions.length > 0)
    : [];

  if (sections.length === 0 && Array.isArray(raw.questions)) {
    const questions = (raw.questions as Record<string, unknown>[])
      .filter((q) => q)
      .map((q, qi) => normalizeQuestion(q, `q${qi + 1}`));
    if (questions.length > 0) {
      sections.push({
        id: "s1",
        passageId: "",
        type: "short-answer",
        instructions: "",
        passage: "",
        questions,
      });
    }
  }

  if (sections.length === 0 && Array.isArray(raw.passages)) {
    const nested: NormalizedSection[] = [];
    (raw.passages as unknown[]).forEach((p, pi) => {
      const pas = (p ?? {}) as Record<string, unknown>;
      const pId = typeof pas.id === "string" ? pas.id : `p${pi + 1}`;
      if (!Array.isArray(pas.sections)) return;
      (pas.sections as unknown[]).forEach((s, si) => {
        const sec = (s ?? {}) as Record<string, unknown>;
        const questions = Array.isArray(sec.questions)
          ? (sec.questions as Record<string, unknown>[])
              .filter((q) => q)
              .map((q, qi) => normalizeQuestion(q, `q${sec.id ?? si + 1}_${qi + 1}`))
          : [];
        if (questions.length === 0) return;
        nested.push({
          id: typeof sec.id === "string" ? sec.id : `s${nested.length + 1}`,
          passageId: pId,
          type: typeof sec.type === "string" ? sec.type : "short-answer",
          instructions:
            typeof sec.instructions === "string" ? sec.instructions : "",
          passage: typeof sec.passage === "string" ? sec.passage : "",
          questions,
        });
      });
    });
    sections.push(...nested);
  }

  let passages = normalizePassages(raw);

  if (passages.length === 0 && typeof raw.passage === "string" && raw.passage.trim()) {
    passages = [{ id: "p1", title: "Reading Passage 1", text: raw.passage }];
  }

  if (passages.length > 0) {
    const known = new Set(passages.map((p) => p.id));
    for (const s of sections) {
      if (!s.passageId || !known.has(s.passageId)) s.passageId = passages[0].id;
    }
  }

  return {
    type: skill,
    passage: typeof raw.passage === "string" ? raw.passage : "",
    passages,
    audioUrl: "",
    audioPublicId: "",
    videoUrl: "",
    sections,
    writingTask1: typeof raw.writingTask1 === "string" ? raw.writingTask1 : "",
    writingTask2: typeof raw.writingTask2 === "string" ? raw.writingTask2 : "",
  } as unknown as MockTestContentDoc;
}

/* ------------------------------------------------------------------ */
/*  Answer-key resolver                                                */
/* ------------------------------------------------------------------ */

function normalizeKeyText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,"'´`]/g, "")
    .replace(/\s+/g, " ");
}

function applyAnswerKey(
  content: MockTestContentDoc,
  answerBlob?: string
): MockTestContentDoc {
  if (!content.sections || content.sections.length === 0) return content;
  const text = answerBlob?.trim();
  if (!text) return content;

  const key = new Map<number, string>();
  const tokenRe = /(\d{1,3})(?:[.:)\]\-]+|\s)\s*/g;
  const tokens: { n: number; start: number; numStart: number }[] = [];
  let mt: RegExpExecArray | null;
  while ((mt = tokenRe.exec(text)) !== null) {
    tokens.push({
      n: parseInt(mt[1], 10),
      start: mt.index + mt[0].length,
      numStart: mt.index,
    });
  }
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const end = i + 1 < tokens.length ? tokens[i + 1].numStart : text.length;
    const ans = text
      .slice(t.start, end)
      .replace(/[\s;,\/]+$/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!ans || /^\d{1,4}$/.test(ans)) continue;
    key.set(t.n, ans);
  }

  const letterIndex = (s: string): number =>
    /^[a-zA-Z]$/.test(s) ? s.toUpperCase().charCodeAt(0) - 65 : -1;

  for (const section of content.sections) {
    for (const q of section.questions ?? []) {
      const m = /(\d+)$/.exec(String(q.qid ?? ""));
      const n = m ? parseInt(m[1], 10) : -1;
      const expected = key.get(n);
      if (!expected) continue;

      if (Array.isArray(q.options) && q.options.length > 1) {
        const byText = q.options.findIndex(
          (o) => normalizeKeyText(o) === normalizeKeyText(expected)
        );
        if (byText >= 0) {
          q.correctOption = byText;
          q.answer = q.options[byText];
          continue;
        }
        const li = letterIndex(expected);
        if (li >= 0 && li < q.options.length) {
          q.correctOption = li;
          q.answer = q.options[li];
          continue;
        }
      }
      q.answer = expected;
    }
  }

  return content;
}

function answerCoverage(content: MockTestContentDoc): number {
  const questions = (content.sections ?? []).flatMap((s) => s.questions ?? []);
  if (questions.length === 0) return 0;
  const solved = questions.filter(
    (q) =>
      (Array.isArray(q.options) &&
        q.options.length > 1 &&
        typeof q.correctOption === "number" &&
        q.correctOption >= 0) ||
      (typeof q.answer === "string" && q.answer.trim().length > 0)
  ).length;
  return solved / questions.length;
}

/* ------------------------------------------------------------------ */
/*  Generation                                                         */
/* ------------------------------------------------------------------ */

export async function generateMockTestStructure(opts: {
  skill: StructureSkill;
  questionBlob: string;
  answerBlob?: string;
}): Promise<MockTestContentDoc> {
  const provider = await getProvider();

  const run = async () => {
    const { system, user } = buildStructurePrompt(opts);
    const full = await readFullStream(provider, { system, user, maxTokens: 32768 });
    const parsed = JSON.parse(stripCodeFences(full)) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      throw new StructureError("AI returned invalid test structure");
    }
    return parsed;
  };

  let parsed: Record<string, unknown> | null = null;
  let lastReason = "";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      parsed = await run();
      let content = normalizeContent(parsed, opts.skill);
      if (opts.answerBlob?.trim()) {
        content = applyAnswerKey(content, opts.answerBlob);
      }
      if (opts.skill !== "writing" && content.sections.length === 0) {
        lastReason = "no-questions";
        continue;
      }
      if (opts.skill !== "writing" && answerCoverage(content) < 0.5) {
        lastReason = opts.answerBlob?.trim() ? "answer-key-mismatch" : "no-answers";
        continue;
      }
      return content;
    } catch (error) {
      if (error instanceof StructureError) throw error;
      lastReason = "unreadable";
      if (attempt === 3) throw error;
    }
  }

  const messages: Record<string, string> = {
    "no-questions":
      "The AI couldn't find any questions in that text. Make sure the full question text is pasted in the Question text box, then try again.",
    "no-answers":
      "The AI didn't produce answers for most questions. Paste the answers text in the Answers/answer key box (as \"1. A\" lines), then try again.",
    "answer-key-mismatch":
      "The answers were detected but most could not be matched to questions. Make sure the answer key numbers match the question numbering (e.g. \"1. A\", \"12. TRUE\"), then try again.",
  };
  throw new NoQuestionsError(messages[lastReason] || "AI returned an unreadable structure. Try again.");
}