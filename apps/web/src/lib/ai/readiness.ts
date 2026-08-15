import "server-only";

import type { AiStreamChunk } from "@/lib/ai/provider";
import { getProvider } from "@/lib/ai/provider";
import type { ReadinessResult } from "@/lib/readiness/questions";

export function buildReadinessPrompt(
  result: ReadinessResult
): { system: string; user: string } {
  const system = [
    "You are the Study Abroad Readiness Advisor for FlyBridge Education Group —",
    "an education company that helps international students study, work and build",
    "a career abroad.",
    "",
    "## Your task",
    "Turn a student's assessment answers and their computed readiness score into a",
    "short, warm and professional readiness report.",
    "",
    "## Rules",
    "- Use ONLY the student's answers and the provided score. Never invent facts —",
    "  no test scores, universities, documents or deadlines that were not given.",
    "- Be honest but encouraging. If the score is low, stay constructive and focus",
    "  on exactly what the student should do next.",
    "- Lead '## What needs attention' with the student's priority focus areas — the",
    "  lowest-scoring dimensions — and be specific about how to improve each one.",
    "- Format the report in markdown with these exact sections:",
    "  1. `## Overview` — 2–3 sentences summarising where the student stands.",
    "  2. `## What's working well` — 3–5 bullets on their strengths.",
    "  3. `## What needs attention` — 2–4 bullets on the gaps.",
    "  4. `## Your next steps` — 4–6 checklist items, each starting with '- [ ]'.",
    "- Keep the whole report under 500 words. Plain, direct language. No filler.",
    "- End with the line: 'Book a free consultation with FlyBridge or ask Bridge —",
    "  our AI support bot — anytime.'",
  ].join("\n");

  const answers = result.details
    .map((d) => `- ${d.question}: ${d.answer}`)
    .join("\n");
  const categories = result.categories
    .map((c) => `- ${c.label}: ${c.pct}%`)
    .join("\n");
  const priorityAreas = result.priorityAreas.length
    ? result.priorityAreas.map((p) => `- ${p.label}: ${p.pct}%`).join("\n")
    : "- None — evenly balanced across dimensions";

  const user = [
    "Write the readiness report for this student.",
    "",
    `Overall score: ${result.score}/100 (${result.label})`,
    "",
    "## Answers",
    answers,
    "",
    "## Category scores",
    categories,
    "",
    "## Priority focus areas",
    priorityAreas,
  ].join("\n");

  return { system, user };
}

export async function generateReadinessReport(
  result: ReadinessResult
): Promise<ReadableStream<AiStreamChunk>> {
  const { system, user } = buildReadinessPrompt(result);

  const provider = await getProvider();
  return provider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system,
    messages: [{ role: "user", content: user }],
  });
}