import type { NextRequest } from "next/server";
import {
  MARKETING_ATTRIBUTION_COOKIE,
  marketingTouchFromUrl,
  parseMarketingAttributionCookie,
  type MarketingTouch,
} from "./marketing-attribution.ts";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "campaign_id",
  "adset_id",
  "ad_id",
  "fbclid",
  "gclid",
];

export type LinkAttribution = {
  source: string;
  medium: string;
  campaign: string;
  campaignId: string;
  adsetId: string;
  adId: string;
  content: string;
  term: string;
  page: string;
  landingPage: string;
  referrer: string;
  fbclid: string;
  gclid: string;
  ip: string;
  userAgent: string;
};

function hasTrackingSignal(url: URL) {
  return TRACKING_PARAMS.some((key) => Boolean(url.searchParams.get(key)?.trim()));
}

export function clientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwardedFor || request.headers.get("x-real-ip")?.trim() || "").slice(0, 100);
}

/**
 * Resolves where a click came from, in priority order: campaign params on the
 * page the link was on, campaign params on the request itself, an external
 * referrer, the stored marketing cookie, then direct. Shared by every tracked
 * link surface so anonymous and member clicks attribute the same way.
 */
export function linkAttribution(
  request: NextRequest,
  fallbackPage: string
): LinkAttribution {
  const url = new URL(request.url);
  const refererHeader = request.headers.get("referer") ?? "";
  const ip = clientIp(request);
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? "";

  let refererUrl: URL | undefined;
  if (refererHeader) {
    try {
      refererUrl = new URL(refererHeader, url);
    } catch {
      refererUrl = undefined;
    }
  }

  const referrer =
    refererUrl && refererUrl.host !== url.host
      ? `${refererUrl.origin}${refererUrl.pathname}`.slice(0, 300)
      : "";

  let page = fallbackPage;
  const pageUrl = refererUrl && refererUrl.host === url.host ? refererUrl : undefined;
  if (pageUrl) page = pageUrl.pathname.slice(0, 300);

  const signalUrl =
    pageUrl && hasTrackingSignal(pageUrl) ? pageUrl : hasTrackingSignal(url) ? url : undefined;

  let touch: MarketingTouch | undefined;
  let landingPage = page;

  if (signalUrl) {
    touch = marketingTouchFromUrl(signalUrl, referrer);
  } else if (referrer) {
    touch = marketingTouchFromUrl(url, referrer);
  } else {
    const history = parseMarketingAttributionCookie(
      request.cookies.get(MARKETING_ATTRIBUTION_COOKIE)?.value
    );
    touch = history.lastTouch ?? history.firstTouch;
    if (touch) landingPage = touch.landingPage || page;
  }
  if (!touch) touch = marketingTouchFromUrl(url, "");

  return {
    source: touch.source || "direct",
    medium: touch.medium || "direct",
    campaign: touch.campaign || "",
    campaignId: touch.campaignId || "",
    adsetId: touch.adsetId || "",
    adId: touch.adId || "",
    content: touch.content || "",
    term: touch.term || "",
    page,
    landingPage,
    referrer: referrer || touch.referrer || "",
    fbclid: touch.fbclid || "",
    gclid: touch.gclid || "",
    ip,
    userAgent,
  };
}

export function visitorKeyFor(userId: string | undefined, attribution: LinkAttribution): string {
  return userId ? `u:${userId}` : `a:${attribution.ip}|${attribution.userAgent}`;
}
