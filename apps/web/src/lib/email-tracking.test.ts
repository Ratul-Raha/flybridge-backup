import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isEmailLinkTrackingEnabled,
  rewriteEmailLinks,
  sameSitePath,
  signEmailLink,
  verifyEmailLink,
  withEmailUtm,
} from "./email-tracking.ts";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com").replace(/\/+$/, "");

test("tracking is off without a secret and on with one", () => {
  delete process.env.EMAIL_TRACKING_SECRET;
  delete process.env.AUTH_SECRET;
  assert.equal(isEmailLinkTrackingEnabled(), false);

  process.env.AUTH_SECRET = "auth-secret";
  assert.equal(isEmailLinkTrackingEnabled(), true);

  process.env.EMAIL_TRACKING_SECRET = "email-secret";
  assert.equal(isEmailLinkTrackingEnabled(), true);
  delete process.env.EMAIL_TRACKING_SECRET;
  delete process.env.AUTH_SECRET;
});

test("sign + verify round-trips the destination and meta", (t) => {
  t.after(() => {
    delete process.env.EMAIL_TRACKING_SECRET;
  });
  process.env.EMAIL_TRACKING_SECRET = "test-secret";

  const token = signEmailLink("/programs/ielts?x=1", {
    campaign: "Welcome Email!",
    templateId: "welcome",
    recipient: "Student@Example.com",
  });
  assert.ok(token);

  const verified = verifyEmailLink(token);
  assert.ok(verified);
  assert.equal(verified.destination, "/programs/ielts?x=1");
  assert.equal(verified.campaign, "welcome-email");
  assert.equal(verified.templateId, "welcome");
  assert.equal(verified.recipient, "student@example.com");
});

test("absolute same-site URLs are normalized to a path", (t) => {
  t.after(() => {
    delete process.env.EMAIL_TRACKING_SECRET;
  });
  process.env.EMAIL_TRACKING_SECRET = "test-secret";

  const verified = verifyEmailLink(signEmailLink(`${SITE_URL}/resources`)!);
  assert.equal(verified?.destination, "/resources");
});

test("external links are never signed and tokens never verify", (t) => {
  t.after(() => {
    delete process.env.EMAIL_TRACKING_SECRET;
  });
  process.env.EMAIL_TRACKING_SECRET = "test-secret";

  assert.equal(signEmailLink("https://evil.example.com/steal"), null);
  assert.equal(signEmailLink("https://other-site.com"), null);
  assert.equal(sameSitePath("//evil.example.com"), null);
  assert.equal(sameSitePath("mailto:a@b.com"), null);
});

test("tampered or foreign tokens are rejected", (t) => {
  t.after(() => {
    delete process.env.EMAIL_TRACKING_SECRET;
  });
  process.env.EMAIL_TRACKING_SECRET = "test-secret";

  const token = signEmailLink("/dashboard")!;
  const [body] = token.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ d: "/admin" }), "utf8").toString("base64url");
  const mac = token.split(".")[1];

  assert.equal(verifyEmailLink(`${forgedBody}.${mac}`), null);
  assert.equal(verifyEmailLink(`${body}.notavalidsignature`), null);
  assert.equal(verifyEmailLink("garbage"), null);
  assert.equal(verifyEmailLink(""), null);
  assert.equal(verifyEmailLink(undefined), null);

  delete process.env.EMAIL_TRACKING_SECRET;
  assert.equal(verifyEmailLink(token), null, "links stop verifying without the secret");
});

test("withEmailUtm adds utm params and keeps existing ones", (t) => {
  t.after(() => {
    delete process.env.EMAIL_TRACKING_SECRET;
  });
  process.env.EMAIL_TRACKING_SECRET = "test-secret";

  assert.equal(withEmailUtm("/programs", "welcome"), "/programs?utm_source=email&utm_medium=email&utm_campaign=welcome");
  assert.equal(
    withEmailUtm("/programs?utm_source=already", "welcome"),
    "/programs?utm_source=already&utm_medium=email&utm_campaign=welcome"
  );
});

test("rewriteEmailLinks wraps same-site hrefs only", (t) => {
  t.after(() => {
    delete process.env.EMAIL_TRACKING_SECRET;
  });
  process.env.EMAIL_TRACKING_SECRET = "test-secret";

  const html =
    '<a href="/dashboard">Home</a>' +
    `<a href="${SITE_URL}/resources">Resources</a>` +
    '<a href="https://youtube.com/watch?v=x">Video</a>' +
    '<a href="mailto:hi@example.com">Mail</a>' +
    '<a href="#top">Top</a>' +
    "<a href='/seminars'>Seminars</a>";

  const out = rewriteEmailLinks(html, { campaign: "welcome" });
  const hrefs = [...out.matchAll(/href=(["'])([^"']+)\1/g)].map((m) => m[2]);

  assert.ok(hrefs[0].startsWith("/e/"));
  assert.ok(hrefs[1].startsWith("/e/"));
  assert.equal(hrefs[2], "https://youtube.com/watch?v=x");
  assert.equal(hrefs[3], "mailto:hi@example.com");
  assert.equal(hrefs[4], "#top");
  assert.ok(hrefs[5].startsWith("/e/"));

  // Every wrapped token resolves back to its original same-site destination.
  assert.equal(verifyEmailLink(hrefs[0].slice(3))?.destination, "/dashboard");
  assert.equal(verifyEmailLink(hrefs[5].slice(3))?.destination, "/seminars");
});

test("rewriteEmailLinks is a no-op when tracking is disabled", () => {
  delete process.env.EMAIL_TRACKING_SECRET;
  delete process.env.AUTH_SECRET;
  const html = '<a href="/dashboard">Home</a>';
  assert.equal(rewriteEmailLinks(html), html);
});
