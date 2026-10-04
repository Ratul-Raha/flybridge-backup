import assert from "node:assert/strict";
import { test } from "node:test";

import { applyWishlistDiscount } from "./wishlist.ts";

test("a zero or missing percent leaves the price alone", () => {
  assert.deepEqual(applyWishlistDiscount(2999, 0), { percent: 0, amount: 0, price: 2999 });
  assert.deepEqual(applyWishlistDiscount(2999, NaN), { percent: 0, amount: 0, price: 2999 });
});

test("the wishlist percent stacks on the already-discounted price", () => {
  // 2999 (after the general discount) less 10% wishlist.
  const result = applyWishlistDiscount(2999, 10);
  assert.equal(result.percent, 10);
  assert.equal(result.amount, 299.9);
  assert.equal(result.price, 2699.1);
});

test("a percent over 100 is clamped so the price can never go negative", () => {
  const result = applyWishlistDiscount(1000, 150);
  assert.equal(result.percent, 100);
  assert.equal(result.price, 0);
  assert.equal(result.amount, 1000);
});

test("a non-positive price is returned unchanged", () => {
  assert.equal(applyWishlistDiscount(0, 20).price, 0);
});
