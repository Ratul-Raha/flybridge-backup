import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_REFUND_REASON,
  NOT_REFUNDABLE_REASON,
  REFUNDABLE_ITEM_TYPES,
  REFUND_BUNDLE_MOCK_LIMIT,
  REFUND_LESSON_LIMIT,
  REFUND_MOCK_LIMIT,
  REFUND_REASONS,
  REFUND_REASON_LABELS,
  REFUND_WINDOW_MS,
  UNKNOWN_ITEM_REASON,
  forfeitReasonFor,
  isRefundReason,
  isRefundableItemType,
  lessonLimitFor,
  lessonsUntilForfeit,
  mockLimitFor,
  mocksUntilForfeit,
  normalizeRefundReason,
  refundReasonLabel,
  refundWindowEnds,
  resolveRefundView,
  type RefundForfeitReason,
} from "./refund-policy.ts";

const NOW = new Date("2026-03-10T12:00:00.000Z");
const COMPLETED_AT = new Date("2026-03-10T00:00:00.000Z");

function view(over: Partial<Parameters<typeof resolveRefundView>[0]> = {}) {
  return resolveRefundView({
    orderId: "order-1",
    orderStatus: "completed",
    itemType: "course",
    amount: 5999,
    currency: "BDT",
    completedAt: COMPLETED_AT,
    lessonsPlayed: 0,
    mockTestsPlayed: 0,
    forfeitedAt: null,
    forfeitReason: null,
    now: NOW,
    ...over,
  });
}

describe("forfeitReasonFor", () => {
  it("allows usage up to and including the limit", () => {
    assert.equal(forfeitReasonFor(0, 0), null);
    assert.equal(forfeitReasonFor(REFUND_LESSON_LIMIT, 0), null);
    assert.equal(forfeitReasonFor(0, REFUND_MOCK_LIMIT), null);
  });

  it("forfeits one step past either limit", () => {
    assert.equal(forfeitReasonFor(REFUND_LESSON_LIMIT + 1, 0), "lessons");
    assert.equal(forfeitReasonFor(0, REFUND_MOCK_LIMIT + 1), "mock");
  });

  it("reports lessons first when both are over", () => {
    assert.equal(forfeitReasonFor(99, 99), "lessons");
  });
});

describe("usage counters", () => {
  it("counts down to the limit and floors at zero", () => {
    assert.equal(lessonsUntilForfeit(0), REFUND_LESSON_LIMIT);
    assert.equal(lessonsUntilForfeit(REFUND_LESSON_LIMIT), 0);
    assert.equal(lessonsUntilForfeit(REFUND_LESSON_LIMIT + 4), 0);
    assert.equal(mocksUntilForfeit(0), REFUND_MOCK_LIMIT);
    assert.equal(mocksUntilForfeit(REFUND_MOCK_LIMIT + 1), 0);
  });
});

describe("refundWindowEnds", () => {
  it("adds the window to a completed order", () => {
    assert.equal(
      refundWindowEnds(COMPLETED_AT)?.getTime(),
      COMPLETED_AT.getTime() + REFUND_WINDOW_MS
    );
  });

  it("accepts a serialised date and rejects nonsense", () => {
    assert.equal(
      refundWindowEnds(COMPLETED_AT.toISOString())?.getTime(),
      COMPLETED_AT.getTime() + REFUND_WINDOW_MS
    );
    assert.equal(refundWindowEnds(null), null);
    assert.equal(refundWindowEnds("not-a-date"), null);
  });
});

describe("resolveRefundView — the claim gate", () => {
  it("is claimable inside the window with no usage", () => {
    const v = view();
    assert.equal(v.status, "refundable");
    assert.equal(v.canClaim, true);
    assert.equal(v.forfeited, false);
    assert.equal(v.windowEndsAt, refundWindowEnds(COMPLETED_AT)!.toISOString());
  });

  /**
   * The regression that mattered: the verdict used to be read off
   * `refundForfeitedAt` alone, so any enrollment whose counters were over the
   * limit but whose flag was missing still showed a live button and passed
   * `claimRefund`. The verdict is now recomputed from the counters.
   */
  it("forfeits from the counters even when the flag was never stamped", () => {
    const v = view({ lessonsPlayed: REFUND_LESSON_LIMIT + 1 });
    assert.equal(v.status, "forfeited");
    assert.equal(v.canClaim, false);
    assert.equal(v.forfeited, true);
    assert.equal(v.forfeitReason, "lessons");
  });

  it("forfeits on the second mock exam even with no flag", () => {
    const v = view({ mockTestsPlayed: REFUND_MOCK_LIMIT + 1 });
    assert.equal(v.status, "forfeited");
    assert.equal(v.forfeitReason, "mock");
  });

  it("still honours a flag the counters do not explain", () => {
    const v = view({
      forfeitedAt: new Date(),
      forfeitReason: "manual",
    });
    assert.equal(v.status, "forfeited");
    assert.equal(v.forfeitReason, "manual");
    assert.equal(v.canClaim, false);
  });

  it("lets a reason the counters explain win over a stale flag", () => {
    const v = view({
      lessonsPlayed: REFUND_LESSON_LIMIT + 1,
      forfeitedAt: new Date(),
      forfeitReason: "mock",
    });
    assert.equal(v.forfeitReason, "lessons");
  });

  it("defaults an unexplained flag to the manual reason", () => {
    const v = view({ forfeitedAt: new Date() });
    assert.equal(v.status, "forfeited");
    assert.equal(v.forfeitReason, "manual");
  });

  it("exposes the remaining allowance without granting a claim past it", () => {
    const v = view({ lessonsPlayed: REFUND_LESSON_LIMIT });
    assert.equal(v.canClaim, true);
    assert.equal(v.lessonsRemaining, 0);
    assert.equal(v.lessonsPlayed, REFUND_LESSON_LIMIT);
  });
});

describe("resolveRefundView — precedence", () => {
  it("puts a refunded order first, ahead of usage and the window", () => {
    const v = view({ orderStatus: "refunded", lessonsPlayed: 99 });
    assert.equal(v.status, "refunded");
    assert.equal(v.canClaim, false);
  });

  it("rejects anything that is not completed", () => {
    for (const orderStatus of ["pending", "failed", "cancelled"]) {
      const v = view({ orderStatus });
      assert.equal(v.status, "ineligible");
      assert.equal(v.canClaim, false);
    }
  });

  it("puts a live request ahead of a forfeit and the window", () => {
    const v = view({
      lessonsPlayed: 99,
      request: { id: "r-1", status: "pending" },
    });
    assert.equal(v.status, "pending");
    assert.equal(v.canClaim, false);
    assert.equal(v.requestId, "r-1");
  });

  it("reports an approved request as approved, not pending", () => {
    const v = view({ request: { id: "r-1", status: "approved" } });
    assert.equal(v.status, "approved");
    assert.equal(v.canClaim, false);
  });

  it("ignores a declined request so the student can claim again", () => {
    const v = view({ request: { id: "r-1", status: "declined" } });
    assert.equal(v.status, "refundable");
    assert.equal(v.canClaim, true);
  });

  it("puts usage ahead of a closed window", () => {
    const v = view({
      lessonsPlayed: REFUND_LESSON_LIMIT + 1,
      now: new Date(COMPLETED_AT.getTime() + REFUND_WINDOW_MS + 1000),
    });
    assert.equal(v.status, "forfeited");
  });
});

describe("resolveRefundView — the window", () => {
  it("closes the moment the window passes", () => {
    const v = view({ now: new Date(COMPLETED_AT.getTime() + REFUND_WINDOW_MS + 1) });
    assert.equal(v.status, "expired");
    assert.equal(v.canClaim, false);
    assert.equal(v.forfeited, false);
  });

  it("is still open one millisecond before it shuts", () => {
    const v = view({ now: new Date(COMPLETED_AT.getTime() + REFUND_WINDOW_MS - 1) });
    assert.equal(v.status, "refundable");
    assert.equal(v.canClaim, true);
  });

  it("cannot work out the window without a completion date", () => {
    const v = view({ completedAt: null });
    assert.equal(v.status, "ineligible");
    assert.equal(v.canClaim, false);
  });
});

describe("resolveRefundView — echoed fields", () => {
  it("carries the order through untouched", () => {
    const v = view();
    assert.equal(v.orderId, "order-1");
    assert.equal(v.amount, 5999);
    assert.equal(v.currency, "BDT");
    assert.equal(v.completedAt, COMPLETED_AT.toISOString());
  });

  it("falls back to a safe currency", () => {
    const v = view({ currency: "" });
    assert.equal(v.currency, "USD");
  });
});

describe("limits per item type", () => {
  it("gives a course the lesson and mock allowance", () => {
    assert.equal(lessonLimitFor("course"), REFUND_LESSON_LIMIT);
    assert.equal(mockLimitFor("course"), REFUND_MOCK_LIMIT);
  });

  it("gives a bundle no lessons and no free sitting", () => {
    assert.equal(lessonLimitFor("mock-bundle"), 0);
    assert.equal(mockLimitFor("mock-bundle"), REFUND_BUNDLE_MOCK_LIMIT);
    assert.equal(REFUND_BUNDLE_MOCK_LIMIT, 0);
  });

  it("reports the limits that actually applied", () => {
    const v = view();
    assert.equal(v.itemType, "course");
    assert.equal(v.lessonLimit, REFUND_LESSON_LIMIT);
    assert.equal(v.mockLimit, REFUND_MOCK_LIMIT);
  });
});

describe("resolveRefundView — mock bundles", () => {
  it("is claimable inside the window with nothing submitted", () => {
    const v = view({ itemType: "mock-bundle" });
    assert.equal(v.status, "refundable");
    assert.equal(v.canClaim, true);
    assert.equal(v.mocksRemaining, 0);
  });

  /**
   * The bundle rule: one submitted sitting ends the refund. Counted on submit,
   * so an abandoned in_progress attempt never reaches this.
   */
  it("forfeits on the first submitted mock", () => {
    const v = view({ itemType: "mock-bundle", mockTestsPlayed: 1 });
    assert.equal(v.status, "forfeited");
    assert.equal(v.canClaim, false);
    assert.equal(v.forfeitReason, "mock");
  });

  it("forfeits even with no stamp on the enrollment", () => {
    const v = view({ itemType: "mock-bundle", mockTestsPlayed: 1, forfeitedAt: null });
    assert.equal(v.status, "forfeited");
  });

  it("uses the bundle wording, not the course wording", () => {
    const v = view({ itemType: "mock-bundle", mockTestsPlayed: 1 });
    assert.match(v.message, /submitted a mock exam/i);
    assert.doesNotMatch(v.message, /played more than/i);
  });

  it("is not tripped by a course-style lesson count", () => {
    // A bundle has no lessons, so the lesson limit of 0 must not fire on 0.
    const v = view({ itemType: "mock-bundle" });
    assert.equal(v.forfeited, false);
  });

  it("still expires the window even with nothing submitted", () => {
    const v = view({
      itemType: "mock-bundle",
      now: new Date(COMPLETED_AT.getTime() + REFUND_WINDOW_MS + 1),
    });
    assert.equal(v.status, "expired");
  });
});

describe("resolveRefundView — items outside the guarantee", () => {
  it("refuses a resource with its own reason", () => {
    const v = view({ itemType: "resource" });
    assert.equal(v.status, "ineligible");
    assert.equal(v.canClaim, false);
    assert.equal(v.message, NOT_REFUNDABLE_REASON.resource);
  });

  it("refuses a seminar with its own reason", () => {
    const v = view({ itemType: "seminar" });
    assert.equal(v.status, "ineligible");
    assert.equal(v.canClaim, false);
    assert.equal(v.message, NOT_REFUNDABLE_REASON.seminar);
  });

  it("covers only courses and bundles", () => {
    assert.deepEqual([...REFUNDABLE_ITEM_TYPES], ["course", "mock-bundle"]);
    assert.equal(isRefundableItemType("course"), true);
    assert.equal(isRefundableItemType("mock-bundle"), true);
    assert.equal(isRefundableItemType("resource"), false);
    assert.equal(isRefundableItemType("seminar"), false);
  });

  /** Nothing was consumed, so the usage counters must not be the reason. */
  it("is ineligible with a pristine usage record", () => {
    const v = view({ itemType: "resource", lessonsPlayed: 0, mockTestsPlayed: 0 });
    assert.equal(v.status, "ineligible");
    assert.equal(v.forfeited, false);
  });

  it("falls back for an unknown item type", () => {
    const v = view({ itemType: "mystery-box" });
    assert.equal(v.status, "ineligible");
    assert.equal(v.message, UNKNOWN_ITEM_REASON);
  });

  it("still reports a refunded order as refunded", () => {
    const v = view({ itemType: "resource", orderStatus: "refunded" });
    assert.equal(v.status, "refunded");
  });

  /**
   * A claim raised under the old, wider policy is already in flight, so it has
   * to keep reporting its real state rather than flip to ineligible. This does
   * not re-open a claim: the write path passes no request, so a new one is
   * rejected by the ineligible branch below.
   */
  it("still reports a legacy in-flight claim on a non-refundable item", () => {
    const v = view({ itemType: "resource", request: { id: "r1", status: "pending" } });
    assert.equal(v.status, "pending");
    assert.equal(v.canClaim, false);
  });

  it("lets a fresh claim attempt on a non-refundable item be rejected", () => {
    const v = view({ itemType: "seminar", request: null });
    assert.equal(v.status, "ineligible");
    assert.equal(v.canClaim, false);
  });
});

describe("refund reasons", () => {
  it("offers a way out that requires no justification", () => {
    assert.ok(REFUND_REASONS.includes(DEFAULT_REFUND_REASON));
    assert.equal(DEFAULT_REFUND_REASON, "prefer_not_to_say");
  });

  it("labels every reason it accepts", () => {
    for (const code of REFUND_REASONS) {
      assert.equal(typeof REFUND_REASON_LABELS[code], "string");
      assert.ok(REFUND_REASON_LABELS[code].length > 0);
    }
  });

  it("accepts only codes on the list", () => {
    assert.equal(isRefundReason("technical_issues"), true);
    assert.equal(isRefundReason("because_i_am_mad"), false);
    assert.equal(isRefundReason(""), false);
    assert.equal(isRefundReason(undefined), false);
    assert.equal(isRefundReason(null), false);
    assert.equal(isRefundReason(42), false);
  });

  it("falls back to the no-justification reason on anything unrecognised", () => {
    assert.equal(normalizeRefundReason("  other  "), "other");
    assert.equal(normalizeRefundReason("nonsense"), DEFAULT_REFUND_REASON);
    assert.equal(normalizeRefundReason(undefined), DEFAULT_REFUND_REASON);
  });

  it("renders a label for legacy claims that have no code stored", () => {
    assert.equal(refundReasonLabel("quality_concerns"), REFUND_REASON_LABELS.quality_concerns);
    assert.equal(refundReasonLabel(""), "No reason given");
    assert.equal(refundReasonLabel(undefined), "No reason given");
  });
});

// Keeps the imported type honest: FORFEIT_REASON_TEXT is keyed by this union.
const _reasonIsUnion: RefundForfeitReason = "lessons";
void _reasonIsUnion;
