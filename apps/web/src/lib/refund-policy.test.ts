import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  REFUND_LESSON_LIMIT,
  REFUND_MOCK_LIMIT,
  REFUND_WINDOW_MS,
  forfeitReasonFor,
  lessonsUntilForfeit,
  mocksUntilForfeit,
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

// Keeps the imported type honest: FORFEIT_REASON_TEXT is keyed by this union.
const _reasonIsUnion: RefundForfeitReason = "lessons";
void _reasonIsUnion;
