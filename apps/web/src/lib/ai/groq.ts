import "server-only";

import type { AiProvider } from "@/lib/ai/provider";
import { streamOpenAiCompatible } from "@/lib/ai/openai-compat";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

/**
 * Resolve the model to use, ignoring model ids that clearly belong to another
 * provider (e.g. `gemini-*` / `grok-*`) so switching `AI_PROVIDER` never leaks
 * a foreign model name into Groq.
 */
function resolveModel(model?: string): string {
  if (model && !model.startsWith("gemini-") && !model.startsWith("grok-")) {
    return model;
  }
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

export const groqProvider: AiProvider = {
  id: "groq",

  async streamChat({ model, system, messages, signal, jsonMode, maxTokens }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    return streamOpenAiCompatible({
      url: GROQ_API,
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
