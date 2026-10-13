import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fbcFromTouch,
  marketingTouchFromUrl,
  parseMarketingAttributionCookie,
  updateMarketingTouchHistory,
} from "./marketing-attribution.ts";

test("campaign URLs normalize Meta UTMs and keep only the landing path", () => {
  const touch = marketingTouchFromUrl(
    new URL("https://flybridgeedu.com/programs/ielts?utm_source=instagram&utm_medium=paid_social&utm_campaign=october&campaign_id=123456&adset_id=234567&ad_id=345678&fbclid=click-123"),
    "",
    new Date("2026-10-14T12:00:00.000Z")
  );

  assert.equal(touch.source, "meta");
  assert.equal(touch.medium, "paid_social");
  assert.equal(touch.campaign, "october");
  assert.equal(touch.campaignId, "123456");
  assert.equal(touch.adsetId, "234567");
  assert.equal(touch.adId, "345678");
  assert.equal(touch.landingPage, "/programs/ielts");
  assert.equal(touch.fbclid, "click-123");
  assert.equal(touch.capturedAt, "2026-10-14T12:00:00.000Z");
});

test("click IDs infer paid channels and external referrers are classified", () => {
  const google = marketingTouchFromUrl(
    new URL("https://flybridgeedu.com/programs/course?gclid=google-click")
  );
  const referral = marketingTouchFromUrl(
    new URL("https://flybridgeedu.com/programs/course"),
    "https://example.org/article?private=query"
  );

  assert.equal(google.source, "google");
  assert.equal(google.medium, "paid_search");
  assert.equal(referral.source, "example.org");
  assert.equal(referral.medium, "referral");
  assert.equal(referral.referrer, "https://example.org/article");
});

test("partial UTM tags are not misreported as direct traffic", () => {
  const touch = marketingTouchFromUrl(
    new URL("https://flybridgeedu.com/?utm_campaign=launch")
  );
  assert.equal(touch.source, "unknown");
  assert.equal(touch.medium, "unknown");
});

test("direct visits do not overwrite the latest non-direct campaign", () => {
  const campaign = marketingTouchFromUrl(
    new URL("https://flybridgeedu.com/programs/course?utm_source=meta&utm_medium=paid_social&utm_campaign=launch"),
    ""
  );
  const direct = marketingTouchFromUrl(new URL("https://flybridgeedu.com/programs/course"), "");
  const history = updateMarketingTouchHistory({ firstTouch: campaign, lastTouch: campaign }, direct);

  assert.equal(history.firstTouch?.campaign, "launch");
  assert.equal(history.lastTouch?.campaign, "launch");
});

test("attribution cookies parse safely and fbclid can produce a CAPI fbc value", () => {
  const touch = marketingTouchFromUrl(
    new URL("https://flybridgeedu.com/?fbclid=click-123"),
    "",
    new Date("2026-10-14T12:00:00.000Z")
  );
  const stored = parseMarketingAttributionCookie(
    encodeURIComponent(JSON.stringify({ firstTouch: touch, lastTouch: touch }))
  );

  assert.equal(stored.lastTouch?.fbclid, "click-123");
  assert.equal(fbcFromTouch(stored.lastTouch), "fb.1.1791979200000.click-123");
  assert.deepEqual(parseMarketingAttributionCookie("bad-cookie"), {});
});
