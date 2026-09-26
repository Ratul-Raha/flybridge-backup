import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * GA4 Data API access for the admin traffic dashboard.
 *
 * The browser tag (NEXT_PUBLIC_GA_MEASUREMENT_ID) only *sends* data. Reading it
 * back needs the Data API, which authenticates as a service account that has
 * been granted "Viewer" on the GA4 property.
 *
 * Credentials come from one of:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY  (inline — use on Vercel)
 *   GA4_SERVICE_ACCOUNT_JSON                          (full JSON blob, inline)
 *   GOOGLE_APPLICATION_CREDENTIALS                     (path to a JSON key file)
 */

const PROPERTY_ID = process.env.GA4_PROPERTY_ID?.trim() ?? "";
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ?? "";
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ?? "";
const SERVICE_ACCOUNT_JSON = process.env.GA4_SERVICE_ACCOUNT_JSON ?? "";
const CREDENTIALS_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ?? "";

export class AnalyticsConfigError extends Error {
  constructor(public missing: string[]) {
    super("Google Analytics Data API is not configured");
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _gaClient: BetaAnalyticsDataClient | undefined;
}

/** Env vars still needed before traffic data can be read. Empty means ready. */
export function missingAnalyticsEnv(): string[] {
  const missing: string[] = [];
  if (!PROPERTY_ID) missing.push("GA4_PROPERTY_ID");
  const hasInline = Boolean(CLIENT_EMAIL && PRIVATE_KEY);
  if (!hasInline && !SERVICE_ACCOUNT_JSON && !CREDENTIALS_FILE) {
    missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY");
  }
  return missing;
}

export function isAnalyticsConfigured(): boolean {
  return missingAnalyticsEnv().length === 0;
}

export function analyticsPropertyId(): string {
  return PROPERTY_ID;
}

/** Env values keep literal "\n" from copy/paste; google-auth needs real newlines. */
function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function credentials() {
  if (SERVICE_ACCOUNT_JSON) {
    return JSON.parse(SERVICE_ACCOUNT_JSON);
  }
  if (CLIENT_EMAIL && PRIVATE_KEY) {
    return {
      client_email: CLIENT_EMAIL,
      // Some providers hand back a full service-account JSON pasted into the
      // private-key var; unwrap it so one env var is enough.
      private_key: PRIVATE_KEY.startsWith("{")
        ? JSON.parse(PRIVATE_KEY).private_key
        : normalizePrivateKey(PRIVATE_KEY),
    };
  }
  return undefined;
}

export function getAnalyticsClient(): BetaAnalyticsDataClient {
  if (globalThis._gaClient) return globalThis._gaClient;

  const missing = missingAnalyticsEnv();
  if (missing.length > 0) throw new AnalyticsConfigError(missing);

  const creds = credentials();
  globalThis._gaClient = new BetaAnalyticsDataClient(
    creds ? { credentials: creds } : {}
  );
  return globalThis._gaClient;
}

type CacheEntry = { at: number; value: unknown };

declare global {
  // eslint-disable-next-line no-var
  var _gaCache: Map<string, CacheEntry> | undefined;
}

function cache(): Map<string, CacheEntry> {
  globalThis._gaCache ??= new Map();
  return globalThis._gaCache;
}

/**
 * Realtime numbers barely move between two admins refreshing at once, and every
 * call burns property quota — so hold each report for a few seconds.
 */
export async function cached<T>(key: string, ttlMs: number, run: () => Promise<T>): Promise<T> {
  const hit = cache().get(key);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return hit.value as T;

  const value = await run();
  cache().set(key, { at: now, value });
  return value;
}

export function clearAnalyticsCache() {
  cache().clear();
}

export function toNumber(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
