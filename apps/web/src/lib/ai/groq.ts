import "server-only";

import type { AiProvider } from "@/lib/ai/provider";
import { streamOpenAiCompatible } from "@/lib/ai/openai-compat";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "llama-3.1-8b-instant";

export const groqProvider: AiProvider = {
  id: "groq",

  async streamChat({ model, system, messages, signal }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    return streamOpenAiCompatible({
      url: GROQ_API,
      apiKey,
      model: model || DEFAULT_MODEL,
      system,
      messages,
      signal,
    });
  },
};
