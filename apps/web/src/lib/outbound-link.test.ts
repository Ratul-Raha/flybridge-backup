import assert from "node:assert/strict";
import { test } from "node:test";
import { outboundLink, parseOutboundDestination } from "./outbound-link.ts";

test("external https URLs become /api/go links with a label", () => {
  const href = outboundLink("https://wa.me/8801804400070?text=Hi", { label: "checkout:ielts" });
  assert.ok(href?.startsWith("/api/go?"));
  const params = new URLSearchParams(href!.slice(href!.indexOf("?") + 1));
  assert.equal(params.get("u"), "https://wa.me/8801804400070?text=Hi");
  assert.equal(params.get("l"), "checkout:ielts");
});

test("same-site and non-http(s) URLs are refused", () => {
  assert.equal(outboundLink("https://flybridgeedu.com/programs"), null);
  assert.equal(outboundLink("mailto:hi@example.com"), null);
  assert.equal(outboundLink("javascript:alert(1)"), null);
  assert.equal(outboundLink("not a url"), null);
  assert.equal(outboundLink(""), null);
});

test("parseOutboundDestination validates protocol and trims the label", () => {
  const parsed = parseOutboundDestination("https://example.org/apply", "a".repeat(200));
  assert.equal(parsed?.destination, "https://example.org/apply");
  assert.equal(parsed?.label.length, 120);

  assert.equal(parseOutboundDestination("ftp://example.org", "x"), null);
  assert.equal(parseOutboundDestination("", "x"), null);
  assert.equal(parseOutboundDestination(null, "x"), null);
});
