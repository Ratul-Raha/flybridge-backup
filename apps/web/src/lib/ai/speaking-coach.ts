import "server-only";

import { getProvider } from "@/lib/ai/provider";

export type SpeakingCoachFeedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
  phrases: string[];
};

/** Small job — falls back to the main AI model when no cheap model is set. */
const MODEL = process.env.AI_QUIZ_MODEL || process.env.AI_MODEL || "";

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
}

/**
 * Gives a Spoken English student friendly, actionable feedback on a spoken
 * answer. This is coaching, not IELTS band scoring — the IELTS judge handles
 * exam grading separately.
 */
export async function coachSpeaking(opts: {
  prompt: string;
  transcript: string;
  provider?: string | null;
}): Promise<SpeakingCoachFeedback> {
  const system = [
    "You are a friendly spoken-English coach for FlyBridge Education Group.",
    "A student answered a speaking prompt. The transcript comes from automatic",
    "speech recognition, so ignore missing punctuation, capitalization and",
    "obvious transcription slips. Focus on how they communicated.",
    "",
    "Return ONLY a JSON object with this shape:",
    "{",
    '  "summary": "1-2 encouraging sentences about clarity and fluency",',
    '  "strengths": ["2-3 concrete things the student did well"],',
    '  "improvements": ["2-3 actionable tips on grammar, word choice, structure or confidence"],',
    '  "phrases": ["3 natural phrases or sentences the student could use next time"]',
    "}",
    "",
    "Rules:",
    "- Be specific to the transcript; never give generic advice.",
    "- Keep each item to one short sentence.",
    "- Do not give an IELTS band score.",
    "- Return valid JSON only, with no markdown fences or extra text.",
  ].join("\n");

  const user = [
    `Speaking prompt: ${opts.prompt}`,
    "",
    "Student transcript:",
    opts.transcript,
  ].join("\n");

  const provider = await getProvider(opts.provider);
  const stream = await provider.streamChat({
    model: MODEL,
    system,
    messages: [{ role: "user", content: user }],
    jsonMode: true,
    maxTokens: 800,
  });

  const reader = stream.getReader();
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

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripCodeFences(full)) as Record<string, unknown>;
  } catch {
    throw new Error("The speaking coach returned an unreadable response");
  }

  return {
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary.trim()
        : "Nice work — keep practising a little every day.",
    strengths: stringList(parsed.strengths),
    improvements: stringList(parsed.improvements),
    phrases: stringList(parsed.phrases),
  };
}
