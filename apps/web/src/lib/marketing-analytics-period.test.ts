import assert from "node:assert/strict";
import { test } from "node:test";
import {
  marketingDateKey,
  marketingPeriodWindow,
  parseMarketingPeriod,
} from "./marketing-analytics-period.ts";

test("weekly window uses seven Dhaka calendar days and the matching prior period", () => {
  const window = marketingPeriodWindow("7d", new Date("2026-10-14T12:00:00.000Z"));
  assert.equal(window.start.toISOString(), "2026-10-07T18:00:00.000Z");
  assert.equal(window.end.toISOString(), "2026-10-14T18:00:00.000Z");
  assert.equal(window.previousStart.toISOString(), "2026-09-30T18:00:00.000Z");
  assert.equal(window.previousEnd.toISOString(), window.start.toISOString());
});

test("month-to-date and previous-month windows follow Dhaka calendar boundaries", () => {
  const now = new Date("2026-10-14T12:00:00.000Z");
  const month = marketingPeriodWindow("month", now);
  const previous = marketingPeriodWindow("last-month", now);

  assert.equal(month.start.toISOString(), "2026-09-30T18:00:00.000Z");
  assert.equal(month.end.toISOString(), "2026-10-14T18:00:00.000Z");
  assert.equal(previous.start.toISOString(), "2026-08-31T18:00:00.000Z");
  assert.equal(previous.end.toISOString(), month.start.toISOString());
  assert.equal(previous.previousStart.toISOString(), "2026-07-31T18:00:00.000Z");
  assert.equal(previous.previousEnd.toISOString(), previous.start.toISOString());
  assert.equal(marketingDateKey(month.start), "2026-10-01");
});

test("unknown reporting periods fall back to the trailing 30 days", () => {
  assert.equal(parseMarketingPeriod("all-time"), "30d");
  assert.equal(parseMarketingPeriod("month"), "month");
});
