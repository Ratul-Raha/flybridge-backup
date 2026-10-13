export const MARKETING_ATTRIBUTION_COOKIE = "flybridge_marketing_attribution";
export const MARKETING_ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type MarketingTouch = {
  source: string;
  medium: string;
  campaign: string;
  campaignId: string;
  adsetId: string;
  adId: string;
  content: string;
  term: string;
  landingPage: string;
  referrer: string;
  fbclid: string;
  gclid: string;
  capturedAt: string;
};

export type MarketingTouchHistory = {
  firstTouch?: MarketingTouch;
  /** Latest non-direct touch, so returning direct visits do not erase a campaign. */
  lastTouch?: MarketingTouch;
};

export type OrderAttribution = MarketingTouchHistory & {
  fbc?: string;
  fbp?: string;
  fbclid?: string;
  gclid?: string;
  ip?: string;
  userAgent?: string;
};

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeReferrer(value: string, currentHost: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.host === currentHost) return "";
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return "";
  }
}

export function parseMarketingTouch(value: unknown): MarketingTouch | undefined {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, unknown>;
  const source = clean(input.source, 100).toLowerCase();
  const medium = clean(input.medium, 100).toLowerCase();
  if (!source && !medium) return undefined;

  const capturedAt = clean(input.capturedAt, 40);
  return {
    source: source || "unknown",
    medium: medium || "unknown",
    campaign: clean(input.campaign, 180),
    campaignId: clean(input.campaignId, 100),
    adsetId: clean(input.adsetId, 100),
    adId: clean(input.adId, 100),
    content: clean(input.content, 180),
    term: clean(input.term, 180),
    landingPage: clean(input.landingPage, 300),
    referrer: clean(input.referrer, 300),
    fbclid: clean(input.fbclid, 500),
    gclid: clean(input.gclid, 500),
    capturedAt:
      capturedAt && !Number.isNaN(Date.parse(capturedAt))
        ? new Date(capturedAt).toISOString()
        : new Date().toISOString(),
  };
}

export function parseMarketingTouchHistory(value: unknown): MarketingTouchHistory {
  if (!value || typeof value !== "object") return {};
  const input = value as Record<string, unknown>;
  return {
    firstTouch: parseMarketingTouch(input.firstTouch),
    lastTouch: parseMarketingTouch(input.lastTouch),
  };
}

export function parseMarketingAttributionCookie(value: string | undefined): MarketingTouchHistory {
  if (!value) return {};
  const candidates = [value];
  try {
    candidates.push(decodeURIComponent(value));
  } catch {
    // Keep trying the raw value; malformed cookie encoding should not break checkout.
  }

  for (const candidate of candidates) {
    try {
      return parseMarketingTouchHistory(JSON.parse(candidate));
    } catch {
      // Ignore invalid or stale client-side data.
    }
  }
  return {};
}

export function marketingTouchFromUrl(
  url: URL,
  referrer = "",
  now: Date = new Date()
): MarketingTouch {
  const params = url.searchParams;
  const fbclid = clean(params.get("fbclid"), 500);
  const gclid = clean(params.get("gclid"), 500);
  const utmSource = clean(params.get("utm_source"), 100).toLowerCase();
  const hasUtm = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].some(
    (key) => Boolean(params.get(key)?.trim())
  );
  const rawSource = utmSource || (fbclid ? "meta" : gclid ? "google" : hasUtm ? "unknown" : "");
  const source =
    rawSource === "facebook" || rawSource === "instagram" || rawSource === "fb"
      ? "meta"
      : rawSource;
  const externalReferrer = safeReferrer(referrer, url.host);
  const referrerHost = externalReferrer ? new URL(externalReferrer).hostname : "";
  const isMetaReferrer = /(^|\.)(facebook|fb|instagram)\.com$/i.test(referrerHost);
  const inferredSource = source || (isMetaReferrer ? "meta" : referrerHost);
  const resolvedSource = inferredSource || "direct";
  const medium =
    clean(params.get("utm_medium"), 100).toLowerCase() ||
    (fbclid
      ? "paid_social"
      : gclid
        ? "paid_search"
        : isMetaReferrer
          ? "social_referral"
          : referrerHost
            ? "referral"
            : resolvedSource === "direct"
              ? "direct"
              : "unknown");

  return {
    source: resolvedSource,
    medium,
    campaign: clean(params.get("utm_campaign"), 180),
    campaignId: clean(params.get("campaign_id") || params.get("utm_id"), 100),
    adsetId: clean(params.get("adset_id"), 100),
    adId: clean(params.get("ad_id"), 100),
    content: clean(params.get("utm_content"), 180),
    term: clean(params.get("utm_term"), 180),
    landingPage: clean(url.pathname, 300),
    referrer: externalReferrer,
    fbclid,
    gclid,
    capturedAt: now.toISOString(),
  };
}

export function updateMarketingTouchHistory(
  existingValue: unknown,
  currentValue: unknown
): MarketingTouchHistory {
  const existing = parseMarketingTouchHistory(existingValue);
  const current = parseMarketingTouch(currentValue);
  if (!current) return existing;

  const isDirect = current.source === "direct" || current.medium === "direct";
  return {
    firstTouch: existing.firstTouch ?? current,
    lastTouch: isDirect ? existing.lastTouch ?? current : current,
  };
}

export function fbcFromTouch(touch?: MarketingTouch): string | undefined {
  if (!touch?.fbclid) return undefined;
  const timestamp = Date.parse(touch.capturedAt);
  return `fb.1.${Number.isFinite(timestamp) ? timestamp : Date.now()}.${touch.fbclid}`;
}
