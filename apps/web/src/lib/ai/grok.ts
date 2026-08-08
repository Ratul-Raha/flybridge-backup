import "server-only";

import type { AiProvider } from "@/lib/ai/provider";
import { placeholderStream, streamOpenAiCompatible } from "@/lib/ai/openai-compat";

const XAI_API = "https://api.x.ai/v1/chat/completions";

const DEFAULT_MODEL = "grok-3-mini";

/**
 * Grok provider (placeholder).
 *
 * Fully wired to x.ai's OpenAI-compatible endpoint — set `GROK_API_KEY` in the
 * environment to activate it. Until then it streams a canned reply so the chat
 * keeps working during development.
 */
export const grokProvider: AiProvider = {
  id: "grok",

  async streamChat({ model, system, messages, signal }) {
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey) {
      return placeholderStream(
        "Grok is not configured yet. Add GROK_API_KEY to your environment " +
          "(https://console.x.ai) to enable live answers — everything else is already wired up."
      );
    }

    return streamOpenAiCompatible({
      url: XAI_API,
      apiKey,
      model: model || DEFAULT_MODEL,
      system,
      messages,
      signal,
    });
  },
};
