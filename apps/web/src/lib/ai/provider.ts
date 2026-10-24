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

export type AiProviderId = "groq" | "gemini" | "grok";

export type AiProvider = {
  id: AiProviderId;
  /** Streaming chat completions (OpenAI-compatible or provider-native). */
  streamChat(options: {
    model: string;
    system: string;
    messages: AiMessage[];
    signal?: AbortSignal;
    jsonMode?: boolean;
    maxTokens?: number;
  }): Promise<ReadableStream<AiStreamChunk>>;
};

const PROVIDER_IDS: AiProviderId[] = ["groq", "gemini", "grok"];

export function isAiProviderId(value: unknown): value is AiProviderId {
  return typeof value === "string" && (PROVIDER_IDS as string[]).includes(value);
}

async function loadProvider(id: AiProviderId): Promise<AiProvider> {
  switch (id) {
    case "groq":
      return (await import("@/lib/ai/groq")).groqProvider;
    case "gemini":
      return (await import("@/lib/ai/gemini")).geminiProvider;
    case "grok":
      return (await import("@/lib/ai/grok")).grokProvider;
  }
}

function fromEnv(): AiProviderId | null {
  const envDefault = process.env.AI_PROVIDER?.trim().toLowerCase();
  return envDefault && isAiProviderId(envDefault) ? envDefault : null;
}

function fromKeys(): AiProviderId {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROK_API_KEY) return "grok";
  return "groq";
}

/**
 * Loads the active provider. Resolution order:
 * 1. An explicit per-request preference (e.g. a `provider` field on the request).
 * 2. The admin dashboard setting (DB-backed, set in `/dashboard/settings/ai`).
 * 3. The `AI_PROVIDER` env var.
 * 4. The first provider whose API key is configured.
 * 5. Groq, so an actionable error is raised when nothing is set.
 */
export async function getProvider(preferred?: string | null): Promise<AiProvider> {
  const explicit = preferred?.trim().toLowerCase();
  if (explicit && isAiProviderId(explicit)) {
    return loadProvider(explicit);
  }

  try {
    const { loadAiSettings } = await import("@/lib/ai/settings");
    const settings = await loadAiSettings();
    return loadProvider(settings.provider);
  } catch {
    // Fall back to env / key detection if the settings layer is unavailable.
  }

  return loadProvider(fromEnv() ?? fromKeys());
}
