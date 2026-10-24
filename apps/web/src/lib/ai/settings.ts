import "server-only";

import { connectDb } from "@/lib/db";
import { AiSettings } from "@/lib/models/ai-settings";
import type { AiProviderId } from "@/lib/ai/provider";

export type AiSettingsSource = "dashboard" | "env" | "auto";

export type AiSettingsState = {
  provider: AiProviderId;
  source: AiSettingsSource;
};

const PROVIDERS: AiProviderId[] = ["groq", "gemini", "grok"];

function isProvider(value: unknown): value is AiProviderId {
  return typeof value === "string" && (PROVIDERS as string[]).includes(value);
}

function fromEnv(): AiProviderId | null {
  const envDefault = process.env.AI_PROVIDER?.trim().toLowerCase();
  return envDefault && isProvider(envDefault) ? envDefault : null;
}

function fromKeys(): AiProviderId {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROK_API_KEY) return "grok";
  return "groq";
}

let cache: (AiSettingsState & { at: number }) | null = null;
const CACHE_TTL_MS = 15_000;

/**
 * Resolve the active AI provider in priority order:
 * 1. The admin dashboard override (stored in the DB).
 * 2. The `AI_PROVIDER` env var.
 * 3. The first provider whose API key is configured.
 */
export async function loadAiSettings(options?: {
  force?: boolean;
}): Promise<AiSettingsState> {
  if (!options?.force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { provider: cache.provider, source: cache.source };
  }

  let state: AiSettingsState = { provider: "groq", source: "auto" };

  try {
    await connectDb();
    const doc = await AiSettings.findOne({ _id: "provider" }).lean<{
      provider?: string;
    }>();
    if (doc?.provider && isProvider(doc.provider)) {
      state = { provider: doc.provider, source: "dashboard" };
    }
  } catch (error) {
    console.error("ai settings load error", error);
  }

  if (state.source !== "dashboard") {
    const envProvider = fromEnv();
    state = envProvider
      ? { provider: envProvider, source: "env" }
      : { provider: fromKeys(), source: "auto" };
  }

  cache = { ...state, at: Date.now() };
  return state;
}

export async function saveAiSettings(patch: {
  provider?: AiProviderId;
}): Promise<AiSettingsState> {
  await connectDb();
  const current = await loadAiSettings({ force: true });
  const provider: AiProviderId = patch.provider ?? current.provider;

  await AiSettings.updateOne(
    { _id: "provider" },
    { $set: { provider } },
    { upsert: true }
  );

  const next: AiSettingsState = { provider, source: "dashboard" };
  cache = { ...next, at: Date.now() };
  return next;
}

/** Clear the dashboard override and fall back to env / key detection. */
export async function clearAiSettings(): Promise<AiSettingsState> {
  await connectDb();
  await AiSettings.deleteOne({ _id: "provider" });

  const envProvider = fromEnv();
  const next: AiSettingsState = envProvider
    ? { provider: envProvider, source: "env" }
    : { provider: fromKeys(), source: "auto" };
  cache = { ...next, at: Date.now() };
  return next;
}
