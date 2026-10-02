import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isDiscountLive,
  parseCourseDiscount,
  publicCoursePricing,
  resolveCoursePrice,
} from "./course-discount.ts";

const now = new Date("2026-10-02T00:00:00.000Z");

test("a discount that is switched off is never applied", () => {
  const resolved = resolveCoursePrice(5999, { active: false, name: "Launch", price: 2999 }, now);
  assert.equal(resolved.price, 5999);
  assert.equal(resolved.originalPrice, null);
  assert.equal(resolved.savings, 0);
  assert.equal(resolved.label, null);
});

test("a running discount is applied to everyone the same way", () => {
  const resolved = resolveCoursePrice(5999, { active: true, name: "Launch", price: 2999 }, now);
  assert.equal(resolved.price, 2999);
  assert.equal(resolved.originalPrice, 5999);
  assert.equal(resolved.savings, 3000);
  assert.equal(resolved.label, "Launch");
});

test("a discount waiting to start is not applied yet", () => {
  const discount = {
    active: true,
    price: 2999,
    startsAt: new Date("2026-10-10T00:00:00.000Z"),
  };
  assert.equal(isDiscountLive(discount, now), false);
  assert.equal(resolveCoursePrice(5999, discount, now).price, 5999);
});

test("a discount that has ended retires itself", () => {
  const discount = {
    active: true,
    price: 2999,
    endsAt: new Date("2026-10-01T00:00:00.000Z"),
  };
  assert.equal(isDiscountLive(discount, now), false);
  assert.equal(resolveCoursePrice(5999, discount, now).price, 5999);
});

test("no end date runs until the discount is switched off", () => {
  const discount = { active: true, price: 2999, endsAt: null };
  assert.equal(isDiscountLive(discount, new Date("2035-01-01T00:00:00.000Z")), true);
});

test("a discount at or above the full price is ignored so nobody is charged more", () => {
  assert.equal(resolveCoursePrice(2999, { active: true, price: 2999 }, now).price, 2999);
  const over = resolveCoursePrice(2999, { active: true, price: 5000 }, now);
  assert.equal(over.price, 2999);
  assert.equal(over.originalPrice, null);
});

test("a discount with no usable price does nothing", () => {
  assert.equal(resolveCoursePrice(5999, { active: true, price: 0 }, now).price, 5999);
  assert.equal(resolveCoursePrice(5999, null, now).price, 5999);
});

test("public pricing returns the discounted BDT price and the original for the strikethrough", () => {
  const pricing = publicCoursePricing(
    { prices: { USD: 49, BDT: 5999 }, discount: { active: true, name: "Launch Deal", price: 2999 } },
    now
  );
  assert.deepEqual(pricing.prices, { USD: 49, BDT: 2999 });
  assert.equal(pricing.price, 2999);
  assert.equal(pricing.originalPrice, "\u09F35,999");
  assert.equal(pricing.discountLabel, "Launch Deal");
  assert.equal(pricing.savings, 3000);
  assert.equal(pricing.discounted, true);
});

test("public pricing shows one price and no strikethrough when nothing is discounted", () => {
  const pricing = publicCoursePricing({ prices: { BDT: 5999 } }, now);
  assert.deepEqual(pricing.prices, { BDT: 5999 });
  assert.equal(pricing.originalPrice, null);
  assert.equal(pricing.discountLabel, null);
  assert.equal(pricing.discounted, false);
  assert.equal(pricing.configured, false);
});

test("a discount that was switched off still counts as configured", () => {
  // Surfaces rely on this to stop showing marketing strikethroughs once an
  // admin has deliberately turned a discount off.
  const pricing = publicCoursePricing(
    { prices: { BDT: 5999 }, discount: { active: false, name: "Launch Deal", price: 2999 } },
    now
  );
  assert.equal(pricing.configured, true);
  assert.equal(pricing.discounted, false);
  assert.equal(pricing.originalPrice, null);
});

test("a course with no price is left alone", () => {
  const pricing = publicCoursePricing({ prices: {}, discount: { active: true, price: 100 } }, now);
  assert.equal(pricing.price, null);
  assert.equal(pricing.discounted, false);
});

test("parsing rejects anything that is not a usable discount", () => {
  const parsed = parseCourseDiscount({ active: "yes", name: "  Deal  ", price: "-5" });
  assert.equal(parsed.active, false);
  assert.equal(parsed.name, "Deal");
  assert.equal(parsed.price, 0);

  assert.deepEqual(parseCourseDiscount(undefined).startsAt, null);
  assert.equal(parseCourseDiscount({ startsAt: "not-a-date" }).startsAt, null);
});