import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateCouponDiscount,
  couponEligibilityError,
  parseCouponInput,
  type CouponRule,
} from "./coupon-rules.ts";

const baseCoupon: CouponRule = {
  code: "SAVE20",
  type: "percent",
  value: 20,
  currency: "BDT",
  appliesTo: "all",
  minSubtotal: 0,
  maxRedemptions: null,
  maxUsesPerUser: 1,
  startsAt: null,
  endsAt: null,
  active: true,
};

test("coupon input normalizes its code and applies safe defaults", () => {
  const parsed = parseCouponInput({ name: "  Launch offer ", code: " launch_20 ", type: "percent", value: 20 });
  assert.equal("error" in parsed, false);
  if ("error" in parsed) return;
  assert.equal(parsed.name, "Launch offer");
  assert.equal(parsed.code, "LAUNCH_20");
  assert.equal(parsed.appliesTo, "all");
  assert.equal(parsed.currency, "BDT");
  assert.equal(parsed.maxUsesPerUser, 1);
  assert.equal(parsed.active, true);
});

test("coupon input rejects invalid codes, values, limits, and date windows", () => {
  assert.match(String((parseCouponInput({ name: "Sale", code: "bad code", type: "percent", value: 10 }) as { error: string }).error), /Code/);
  assert.match(String((parseCouponInput({ name: "Sale", code: "SAVE", type: "percent", value: 101 }) as { error: string }).error), /100/);
  assert.match(String((parseCouponInput({ name: "Sale", code: "SAVE", type: "fixed", value: 5, currency: "EUR" }) as { error: string }).error), /Currency/);
  assert.match(String((parseCouponInput({ name: "Sale", code: "SAVE", type: "fixed", value: 5, maxRedemptions: 0 }) as { error: string }).error), /positive whole number/);
  assert.match(String((parseCouponInput({
    name: "Sale",
    code: "SAVE",
    type: "percent",
    value: 10,
    startsAt: "2026-11-02T00:00:00Z",
    endsAt: "2026-11-01T00:00:00Z",
  }) as { error: string }).error), /Start date/);
});

test("coupon eligibility checks activation dates, product type, currency and minimum subtotal", () => {
  const now = new Date("2026-10-14T12:00:00.000Z");
  assert.match(
    couponEligibilityError({ ...baseCoupon, startsAt: new Date("2026-10-15T00:00:00.000Z") }, {
      itemType: "course", currency: "BDT", eligibleSubtotal: 1000, redemptions: 0, userRedemptions: 0, now,
    }) ?? "",
    /not active yet/
  );
  assert.match(
    couponEligibilityError({ ...baseCoupon, endsAt: new Date("2026-10-13T00:00:00.000Z") }, {
      itemType: "course", currency: "BDT", eligibleSubtotal: 1000, redemptions: 0, userRedemptions: 0, now,
    }) ?? "",
    /expired/
  );
  assert.match(
    couponEligibilityError({ ...baseCoupon, appliesTo: "seminar" }, {
      itemType: "course", currency: "BDT", eligibleSubtotal: 1000, redemptions: 0, userRedemptions: 0, now,
    }) ?? "",
    /does not apply/
  );
  assert.match(
    couponEligibilityError({ ...baseCoupon, type: "fixed", currency: "USD" }, {
      itemType: "course", currency: "BDT", eligibleSubtotal: 1000, redemptions: 0, userRedemptions: 0, now,
    }) ?? "",
    /valid only for USD/
  );
  assert.match(
    couponEligibilityError({ ...baseCoupon, minSubtotal: 1500 }, {
      itemType: "course", currency: "BDT", eligibleSubtotal: 1000, redemptions: 0, userRedemptions: 0, now,
    }) ?? "",
    /minimum subtotal/
  );
});

test("redemption and per-customer caps are enforced", () => {
  const context = {
    itemType: "course" as const,
    currency: "BDT",
    eligibleSubtotal: 1000,
    redemptions: 5,
    userRedemptions: 1,
  };
  assert.match(
    couponEligibilityError({ ...baseCoupon, maxRedemptions: 5 }, context) ?? "",
    /redemption limit/
  );
  assert.match(
    couponEligibilityError(baseCoupon, context) ?? "",
    /maximum number of times/
  );
  assert.equal(
    couponEligibilityError({ ...baseCoupon, maxUsesPerUser: 0 }, context),
    null
  );
});

test("percentage savings round to cents and fixed savings never exceed the price", () => {
  assert.equal(calculateCouponDiscount(baseCoupon, 19.99, "BDT"), 4);
  assert.equal(calculateCouponDiscount({ ...baseCoupon, type: "fixed", value: 500 }, 120, "BDT"), 120);
  assert.equal(calculateCouponDiscount({ ...baseCoupon, type: "fixed", currency: "USD", value: 20 }, 120, "BDT"), 0);
});
