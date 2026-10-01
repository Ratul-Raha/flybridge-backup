import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  appliesInCurrency,
  pickBestCandidate,
  priceFrom,
  roundMoney,
  savingsFor,
  type DiscountCandidate,
} from "./discount-math.ts";

function percent(value: number, extra: Partial<DiscountCandidate> = {}): DiscountCandidate {
  return { label: `${value}% off`, type: "percent", value, ...extra };
}

function fixed(
  value: number,
  currency: string,
  extra: Partial<DiscountCandidate> = {}
): DiscountCandidate {
  return { label: `${value} ${currency} off`, type: "fixed", value, currency, ...extra };
}

describe("roundMoney", () => {
  it("rounds to two decimals without floating point drift", () => {
    assert.equal(roundMoney(5999 * 0.1), 599.9);
    assert.equal(roundMoney(1000 * 0.335), 335);
    assert.equal(roundMoney(5999 / 3), 1999.67);
  });
});

describe("appliesInCurrency", () => {
  it("accepts a percent discount in any currency", () => {
    assert.equal(appliesInCurrency(percent(10), "BDT"), true);
  });

  it("only accepts a fixed discount in the currency it was written in", () => {
    assert.equal(appliesInCurrency(fixed(500, "USD"), "USD"), true);
    assert.equal(appliesInCurrency(fixed(500, "USD"), "BDT"), false);
    assert.equal(appliesInCurrency(fixed(500, "BDT"), "bdt"), true);
  });
});

describe("savingsFor", () => {
  it("takes a percentage of the subtotal", () => {
    assert.equal(savingsFor(percent(10), 5999, "BDT"), 599.9);
  });

  it("takes the fixed amount when the currency matches", () => {
    assert.equal(savingsFor(fixed(500, "BDT"), 5999, "BDT"), 500);
  });

  it("drops a fixed discount in another currency instead of applying it wrongly", () => {
    assert.equal(savingsFor(fixed(500, "USD"), 5999, "BDT"), null);
  });

  it("never discounts more than the subtotal", () => {
    assert.equal(savingsFor(percent(100), 5999, "BDT"), 5999);
    assert.equal(savingsFor(fixed(99999, "BDT"), 5999, "BDT"), 5999);
  });
});

describe("pickBestCandidate", () => {
  it("returns null when nothing applies", () => {
    assert.equal(pickBestCandidate([], 5999, "BDT"), null);
  });

  it("picks the larger saving", () => {
    const best = pickBestCandidate([percent(10), percent(25)], 1000, "BDT");
    assert.equal(best?.candidate.value, 25);
    assert.equal(best?.savings, 250);
  });

  it("ignores a fixed discount the currency rules out", () => {
    const best = pickBestCandidate([fixed(900, "USD"), percent(10)], 1000, "BDT");
    assert.equal(best?.candidate.type, "percent");
    assert.equal(best?.savings, 100);
  });

  it("prefers the entered code when two discounts save the same", () => {
    const best = pickBestCandidate(
      [percent(10, { label: "auto" }), percent(10, { label: "code", code: "SAVE10" })],
      1000,
      "BDT"
    );
    assert.equal(best?.candidate.code, "SAVE10");
  });

  it("keeps the automatic discount when it saves more than the code", () => {
    const best = pickBestCandidate(
      [percent(40, { label: "auto" }), percent(10, { label: "code", code: "TEN" })],
      1000,
      "BDT"
    );
    assert.equal(best?.savings, 400);
    assert.equal(best?.candidate.code, undefined);
  });
});

describe("priceFrom", () => {
  it("is the subtotal when there is no discount", () => {
    assert.deepEqual(priceFrom([], 5999, "BDT"), {
      subtotal: 5999,
      discount: 0,
      total: 5999,
      discountId: undefined,
      code: undefined,
      label: undefined,
    });
  });

  it("subtracts the discount from the subtotal", () => {
    const priced = priceFrom([percent(10, { id: "d1", label: "Launch" })], 5999, "BDT");
    assert.equal(priced.subtotal, 5999);
    assert.equal(priced.discount, 599.9);
    assert.equal(priced.total, 5399.1);
    assert.equal(priced.discountId, "d1");
    assert.equal(priced.label, "Launch");
  });

  it("can take the total to zero", () => {
    const priced = priceFrom([percent(100)], 250, "USD");
    assert.equal(priced.discount, 250);
    assert.equal(priced.total, 0);
  });

  it("reports the applied code so the order records what was typed", () => {
    const priced = priceFrom([percent(10, { code: "SAVE10" })], 1000, "USD");
    assert.equal(priced.code, "SAVE10");
    assert.equal(priced.total, 900);
  });
});
