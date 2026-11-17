import assert from "node:assert/strict";
import { test } from "node:test";
import { requiresPhone } from "./phone-requirement.ts";

test("regular users need a valid phone number", () => {
  assert.equal(requiresPhone("user", null), true);
  assert.equal(requiresPhone("user", undefined), true);
  assert.equal(requiresPhone("user", ""), true);
  assert.equal(requiresPhone("user", "not-a-phone"), true);
  assert.equal(requiresPhone("user", "+8801712345678"), false);
});

test("admins and moderators are always exempt", () => {
  assert.equal(requiresPhone("admin", null), false);
  assert.equal(requiresPhone("admin", "bad"), false);
  assert.equal(requiresPhone("moderator", undefined), false);
  assert.equal(requiresPhone("moderator", "+8801712345678"), false);
});
