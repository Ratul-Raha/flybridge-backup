import "server-only";

import type { AiStreamChunk } from "@/lib/ai/provider";
import { getProvider } from "@/lib/ai/provider";

export type SopDetails = {
  fullName?: string;
  targetCountry: string;
  level: string;
  program: string;
  university?: string;
  academicBackground?: string;
  workExperience?: string;
  achievements?: string;
  careerGoals?: string;
  whyThisProgram?: string;
  personalStory?: string;
  additionalNotes?: string;
};

export type SopOptions = {
  tone: "professional" | "academic" | "personal";
  length: "short" | "medium" | "long";
};

const TONE_GUIDES: Record<SopOptions["tone"], string> = {
  professional: "confident, professional and structured",
  academic: "academic, formal and evidence-driven",
  personal: "warm, personal and story-driven",
};

const LENGTH_TARGETS: Record<SopOptions["length"], string> = {
  short: "300–400 words",
  medium: "500–700 words",
  long: "900–1200 words",
};

export function buildSopPrompt(details: SopDetails, options: SopOptions): { system: string; user: string } {
  const system = [
    "You are an expert university application advisor and Statement of Purpose writer",
    "for FlyBridge Education Group, which helps international students study abroad.",
    "",
    "## Your task",
    `Write a ${LENGTH_TARGETS[options.length]} Statement of Purpose for the student using ONLY`,
    "the details they provide. Never invent facts, institutions, grades, scores or",
    "experiences that the student did not mention.",
    "",
    "## Style",
    `- Use a ${TONE_GUIDES[options.tone]} tone.`,
    "- Write in the first person, from the student's perspective.",
    "- Structure it with clear sections using markdown headings (#, ##).",
    "- Use short paragraphs and plain language. Avoid filler and clichés.",
    "- If important details are missing (e.g. career goals), briefly note in square",
    "  brackets what the student should fill in, e.g. [describe your 1–2 year career goal].",
    "- End with a short conclusion paragraph.",
    "- Do not add a title like \"Statement of Purpose\" unless asked — start with the",
    "  introduction directly.",
  ].join("\n");

  const fields: [string, string][] = [
    ["Full name", details.fullName ?? ""],
    ["Target country", details.targetCountry],
    ["Degree level", details.level],
    ["Intended program / field of study", details.program],
    ["University (if known)", details.university ?? ""],
    ["Academic background", details.academicBackground ?? ""],
    ["Work experience", details.workExperience ?? ""],
    ["Achievements", details.achievements ?? ""],
    ["Career goals", details.careerGoals ?? ""],
    ["Why this program / university", details.whyThisProgram ?? ""],
    ["Personal story", details.personalStory ?? ""],
    ["Additional notes", details.additionalNotes ?? ""],
  ];

  const user = [
    "Write a Statement of Purpose for this student. Use only the details below:",
    "",
    fields
      .filter(([, value]) => value.trim().length > 0)
      .map(([label, value]) => `- ${label}: ${value}`)
      .join("\n"),
  ].join("\n");

  return { system, user };
}

export async function generateSop(
  details: SopDetails,
  options: SopOptions,
  provider?: string | null
): Promise<ReadableStream<AiStreamChunk>> {
  const { system, user } = buildSopPrompt(details, options);

  const activeProvider = await getProvider(provider);
  return activeProvider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system,
    messages: [{ role: "user", content: user }],
  });
}
