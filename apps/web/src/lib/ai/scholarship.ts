import "server-only";

import type { AiStreamChunk } from "@/lib/ai/provider";
import { getProvider } from "@/lib/ai/provider";

export type ParsedScholarship = {
  title: string;
  description: string;
  country: string;
  countryCode: string;
  level: "any" | "undergraduate" | "graduate" | "postgraduate" | "school";
  amount: string;
  deadline: string;
  eligibility: string;
  applyUrl: string;
};

export const LEVELS: ParsedScholarship["level"][] = [
  "any",
  "undergraduate",
  "graduate",
  "postgraduate",
  "school",
];

const LEVEL_HINTS: Record<string, ParsedScholarship["level"]> = {
  school: "school",
  secondary: "school",
  "high school": "school",
  "bachelor": "undergraduate",
  "bachelors": "undergraduate",
  "undergraduate": "undergraduate",
  "b.sc": "undergraduate",
  "b.tech": "undergraduate",
  "bs": "undergraduate",
  beng: "undergraduate",
  master: "graduate",
  masters: "graduate",
  "m.sc": "graduate",
  "m.tech": "graduate",
  "msc": "graduate",
  graduate: "graduate",
  phd: "postgraduate",
  doctorate: "postgraduate",
  doctoral: "postgraduate",
  postgraduate: "postgraduate",
};

function normalizeLevel(value: string | undefined): ParsedScholarship["level"] {
  const raw = (value ?? "").toLowerCase().trim();
  if (!raw) return "any";
  for (const [hint, level] of Object.entries(LEVEL_HINTS)) {
    if (raw.includes(hint)) return level;
  }
  return "any";
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanUrl(value: unknown): string {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function cleanCode(value: unknown): string {
  const code = cleanText(value).toUpperCase();
  return code.length === 2 ? code : "";
}

function buildPrompt(institution: string, rawText: string): { system: string; user: string } {
  const system = [
    "You are a scholarship specialist for FlyBridge Education Group.",
    "Extract structured information from a scholarship announcement pasted by our staff.",
    "",
    "## Input",
    "- The official institution/university/school name is supplied separately.",
    "- A raw block of text about ONE scholarship is supplied. It may be messy, include headings,",
    "  symbols, line breaks and irrelevant marketing lines.",
    "",
    "## Task",
    "Return a JSON object with ONLY these keys (all strings):",
    '- "title"  — a short, attractive scholarship title (max ~10 words). If unknown, use the institution name.',
    '- "description" — a concise 2–4 sentence summary in plain English (no markdown).',
    '- "country" — the country or countries where the study takes place (e.g. "United States").',
    '- "countryCode" — ISO 3166-1 alpha-2 code for that country (e.g. "US"), or empty if unknown.',
    '- "level" — one of: "any", "undergraduate", "graduate", "postgraduate", "school".',
    '- "amount" — the monetary value / coverage (e.g. "$10,000", "Full tuition", "25% fee waiver"). Empty if not stated.',
    '- "deadline" — the application deadline as written (e.g. "15 December 2026", "Rolling"). Empty if not stated.',
    '- "eligibility" — who can apply, one short paragraph.',
    '- "applyUrl" — the official application link, or empty if not present.',
    "",
    "## Rules",
    "- Never invent facts. If a field is not in the text, return empty string.",
    "- countryCode must be empty unless you are confident of the alpha-2 code.",
  ].join("\n");

  const user = [
    `Institution/University/School: ${institution}`,
    "",
    "Scholarship text:",
    "---",
    rawText,
    "---",
    "",
    "Return only the JSON object.",
  ].join("\n");

  return { system, user };
}

async function streamToText(stream: ReadableStream<AiStreamChunk>): Promise<string> {
  const reader = stream.getReader();
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += value.text;
    }
  } finally {
    reader.releaseLock();
  }
  return text;
}

function extractJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("AI response did not contain a JSON object");
  return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
}

export async function parseScholarshipInput(
  institution: string,
  rawText: string
): Promise<ParsedScholarship> {
  const { system, user } = buildPrompt(institution, rawText);

  const provider = await getProvider();
  const stream = await provider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system,
    messages: [{ role: "user", content: user }],
    jsonMode: true,
  });

  const content = await streamToText(stream);
  const json = extractJson(content);

  return {
    title: cleanText(json.title) || institution,
    description: cleanText(json.description),
    country: cleanText(json.country),
    countryCode: cleanCode(json.countryCode),
    level: normalizeLevel(json.level as string | undefined),
    amount: cleanText(json.amount),
    deadline: cleanText(json.deadline),
    eligibility: cleanText(json.eligibility),
    applyUrl: cleanUrl(json.applyUrl),
  };
}