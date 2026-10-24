import "server-only";

import type { AiMessage, AiProvider, AiStreamChunk } from "@/lib/ai/provider";

const GEMINI_API =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Default Gemini model. `gemini-flash-latest` is the free-tier friendly alias
 * that tracks the latest flash model — safe to override with a pinned model via
 * `GEMINI_MODEL` (e.g. `gemini-2.0-flash`, `gemini-2.5-flash`).
 */
const DEFAULT_MODEL = "gemini-flash-latest";

/** Resolve the model to use, ignoring model ids that belong to another provider. */
function resolveModel(model?: string): string {
  if (model && model.startsWith("gemini-")) return model;
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

type GeminiPart = { text?: string };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

/** Parse an SSE "data: ..." line into its JSON payload. */
function sseData(line: string): unknown | null {
  if (!line.startsWith("data:")) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/** Extract the text delta from a Gemini streaming response payload. */
function textDelta(payload: unknown): string {
  const candidate = (
    payload as { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> }
  ).candidates?.[0];
  const parts = candidate?.content?.parts;
  if (!parts) return "";
  return parts.map((p) => p.text ?? "").join("");
}

/**
 * Streams a Gemini `streamGenerateContent` response as text deltas.
 *
 * Gemini's REST API uses a different wire format from OpenAI-compatible APIs:
 * `system` maps to `systemInstruction`, assistant messages use the `model` role,
 * and JSON mode is requested via `generationConfig.responseMimeType`.
 */
async function streamGemini(options: {
  apiKey: string;
  model: string;
  system: string;
  messages: AiMessage[];
  signal?: AbortSignal;
  jsonMode?: boolean;
  maxTokens?: number;
}): Promise<ReadableStream<AiStreamChunk>> {
  const { apiKey, model, system, messages, signal, jsonMode, maxTokens = 1024 } = options;

  // Split out any system-role messages and fold them into the instruction.
  const systemText = [
    system,
    ...messages.filter((m) => m.role === "system").map((m) => m.content),
  ]
    .filter(Boolean)
    .join("\n\n");

  const contents: GeminiContent[] = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `${GEMINI_API}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      ...(systemText
        ? { systemInstruction: { parts: [{ text: systemText }] } }
        : {}),
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: maxTokens,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    let message = detail.slice(0, 300);
    try {
      const parsed = JSON.parse(detail) as { error?: { message?: string } };
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      // keep the raw detail
    }
    throw new Error(`AI request failed (${res.status}): ${message}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<AiStreamChunk>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const data = sseData(line);
            if (!data) continue;
            const delta = textDelta(data);
            if (delta) controller.enqueue({ text: delta, done: false });
          }
        }

        if (buffer) {
          const data = sseData(buffer);
          if (data) {
            const delta = textDelta(data);
            if (delta) controller.enqueue({ text: delta, done: false });
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        throw error;
      } finally {
        reader.releaseLock();
        controller.enqueue({ text: "", done: true });
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

export const geminiProvider: AiProvider = {
  id: "gemini",

  async streamChat({ model, system, messages, signal, jsonMode, maxTokens }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    return streamGemini({
      apiKey,
      model: resolveModel(model),
      system,
      messages,
      signal,
      jsonMode,
      maxTokens,
    });
  },
};
