import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextRequest } from "next/server";
import { MARKETING_ATTRIBUTION_COOKIE } from "./marketing-attribution.ts";
import { resourceClickAttribution } from "./resource-click-attribution.ts";

const API_URL = "https://flybridgeedu.com/api/resources/64b000000000000000000001/file";
const PAGE = "/resources/64b000000000000000000001";

function makeRequest(
  url: string,
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {}
): NextRequest {
  const headerMap = new Headers(headers);
  return {
    url,
    headers: headerMap,
    cookies: {
      get: (name: string) =>
        cookies[name] === undefined ? undefined : { name, value: cookies[name] },
    },
  } as unknown as NextRequest;
}

test("campaign params on the clicked page win and become the page attribution", () => {
  const request = makeRequest(
    API_URL,
    {
      referer: `${PAGE}?utm_source=instagram&utm_medium=paid_social&utm_campaign=october&ad_id=creative-1`,
      "user-agent": "Mozilla/5.0",
      "x-forwarded-for": "102.130.1.5, 172.16.0.1",
    },
    { [MARKETING_ATTRIBUTION_COOKIE]: "stale" }
  );

  const attribution = resourceClickAttribution(request, PAGE);

  assert.equal(attribution.source, "meta");
  assert.equal(attribution.medium, "paid_social");
  assert.equal(attribution.campaign, "october");
  assert.equal(attribution.adId, "creative-1");
  assert.equal(attribution.page, PAGE);
  assert.equal(attribution.landingPage, PAGE);
  assert.equal(attribution.referrer, "");
  assert.equal(attribution.ip, "102.130.1.5");
  assert.equal(attribution.userAgent, "Mozilla/5.0");
});

test("the marketing attribution cookie supplies the source when the page has none", () => {
  const touch = {
    source: "google",
    medium: "paid_search",
    campaign: "scholarship-push",
    gclid: "g-click-1",
    landingPage: "/scholarships",
    referrer: "",
    capturedAt: "2026-10-01T00:00:00.000Z",
  };
  const request = makeRequest(
    API_URL,
    { referer: PAGE },
    { [MARKETING_ATTRIBUTION_COOKIE]: encodeURIComponent(JSON.stringify({ lastTouch: touch })) }
  );

  const attribution = resourceClickAttribution(request, PAGE);

  assert.equal(attribution.source, "google");
  assert.equal(attribution.medium, "paid_search");
  assert.equal(attribution.campaign, "scholarship-push");
  assert.equal(attribution.gclid, "g-click-1");
  assert.equal(attribution.page, PAGE);
  assert.equal(attribution.landingPage, "/scholarships");
});

test("social referrers that hit the endpoint directly are classified as meta", () => {
  const facebook = resourceClickAttribution(
    makeRequest(API_URL, { referer: "https://www.facebook.com/flybridge/posts/123" }),
    PAGE
  );
  const instagram = resourceClickAttribution(
    makeRequest(API_URL, { referer: "https://www.instagram.com/p/abc/" }),
    PAGE
  );

  assert.equal(facebook.source, "meta");
  assert.equal(facebook.medium, "social_referral");
  assert.equal(facebook.referrer, "https://www.facebook.com/flybridge/posts/123");
  assert.equal(facebook.page, PAGE);
  assert.equal(instagram.source, "meta");
  assert.equal(instagram.medium, "social_referral");
});

test("clicks without any signal stay in the direct bucket", () => {
  const attribution = resourceClickAttribution(makeRequest(API_URL), PAGE);

  assert.equal(attribution.source, "direct");
  assert.equal(attribution.medium, "direct");
  assert.equal(attribution.campaign, "");
  assert.equal(attribution.page, PAGE);
  assert.equal(attribution.landingPage, PAGE);
  assert.equal(attribution.ip, "");
});

test("forwarded campaign params on the request itself are used when the referer is missing", () => {
  const attribution = resourceClickAttribution(
    makeRequest(`${API_URL}?utm_source=facebook&utm_medium=cpc&utm_campaign=visa-fair`),
    PAGE
  );

  assert.equal(attribution.source, "meta");
  assert.equal(attribution.medium, "cpc");
  assert.equal(attribution.campaign, "visa-fair");
  assert.equal(attribution.page, PAGE);
});
