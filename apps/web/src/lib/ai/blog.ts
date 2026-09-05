import "server-only";

import type { AiMessage } from "@/lib/ai/provider";
import { getProvider } from "@/lib/ai/provider";

export type GeneratedBlog = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  slug: string;
};

function buildSystemPrompt(
  subject: string,
  requestedTitle: string
): { system: string; user: string } {
  const system = [
    "You are a senior content writer for FlyBridge Education Group — an education",
    "technology company that helps international students and young professionals",
    "(primarily from South Asia) study, work and build a career abroad through",
    "practical, self-paced, expert-led online courses.",
    "",
    "## Task",
    "Write ONE long-form blog post about the given subject.",
    "",
    "## Tone",
    "Modern, calm, premium, trustworthy, friendly, optimistic. NOT corporate or",
    "salesy. Practical and actionable. Write for ambitious students and early-career",
    "professionals preparing for international opportunities.",
    "",
    "## Output format",
    'Return ONLY a valid JSON object with these exact keys:',
    '  "title"    — a strong, clickable title (use the requested title unless clearly better).',
    '  "excerpt"  — a 1–2 sentence summary for cards and SEO (plain text).',
    '  "category" — a short category label, e.g. "Study Visa", "Career", "English", "Work Abroad".',
    '  "content"  — the full article body (see below).',
    "",
    "## Content rules",
    "- Write 900–1400 words.",
    "- Content must be valid **Markdown**. Use '#' for the H1? No — do NOT include an H1",
    "  in the body; the page shows the title separately. Start with an intro paragraph,",
    "  then use ## H2 subheadings, ### H3 where useful.",
    "- Include markdown bullet lists, bold (**bold**), and short paragraphs. No raw HTML.",
    "- Be factual and helpful. Do not invent providers, prices, dates or policies.",
    "- End by encouraging the reader toward FlyBridge resources/programs without being",
    "  pushy (mention only that FlyBridge has courses/programs on this — no fabricated links).",
    "",
    "Return ONLY the JSON object, no markdown fences.",
  ].join("\n");

  const user = [
    `Requested title: ${requestedTitle}`,
    `Subject: ${subject}`,
    "",
    "Write the blog post.",
  ].join("\n");

  return { system, user };
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function extractJsonObject(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(
      `AI did not return a JSON object. Response preview: ${candidate.slice(0, 200)}`
    );
  }
  return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
}

export async function generateBlogPost(
  subject: string,
  requestedTitle: string
): Promise<GeneratedBlog> {
  const { system, user } = buildSystemPrompt(subject, requestedTitle);

  const provider = await getProvider();
  const stream = await provider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system,
    messages: [{ role: "user", content: user }] satisfies AiMessage[],
    jsonMode: true,
    maxTokens: 6000,
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

  if (!full.trim()) {
    throw new Error("AI returned an empty response");
  }

  let json: Record<string, unknown>;
  try {
    json = extractJsonObject(full);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`AI returned malformed JSON. Response preview: ${full.slice(0, 200)}`);
    }
    throw error;
  }

  const title = cleanText(json.title) || requestedTitle;
  const content = cleanText(json.content);
  if (!content) throw new Error("AI returned an empty blog body");

  return {
    title,
    excerpt: cleanText(json.excerpt) || "",
    content,
    category: cleanText(json.category) || "General",
    author: "FlyBridge Education Group",
    slug: slugify(title),
  };
}