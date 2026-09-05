import "server-only";

export type AiRole = "system" | "user" | "assistant";

export type AiMessage = {
  role: AiRole;
  content: string;
};

export type AiStreamChunk = {
  /** Text delta produced so far by the model. */
  text: string;
  /** True when the stream has finished. */
  done: boolean;
};

export type AiProvider = {
  id: "groq" | "grok";
  /** OpenAI-compatible chat completions with streaming support. */
  streamChat(options: {
    model: string;
    system: string;
    messages: AiMessage[];
    signal?: AbortSignal;
    jsonMode?: boolean;
    maxTokens?: number;
  }): Promise<ReadableStream<AiStreamChunk>>;
};

/**
 * Picks the active provider:
 * - `GROQ_API_KEY`  → Groq (default, https://console.groq.com)
 * - `GROK_API_KEY`  → Grok placeholder (https://console.x.ai)
 * Falls back to Groq so the error message is actionable when nothing is set.
 */
export async function getProvider(): Promise<AiProvider> {
  if (process.env.GROQ_API_KEY) {
    return (await import("@/lib/ai/groq")).groqProvider;
  }
  return (await import("@/lib/ai/grok")).grokProvider;
}
