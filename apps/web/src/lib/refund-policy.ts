/**
 * Refund + access policy. Pure, so both the server routes and the client UI can
 * share the numbers and the wording without pulling the database in.
 *
 * The rule set:
 *  - Only courses and mock bundles are covered. Resources and seminars are never
 *    refundable, whatever the clock says.
 *  - A covered purchase is refundable for REFUND_WINDOW_DAYS after it completed.
 *  - A refund is forfeited forever once the student crosses the usage limit for
 *    that item type: REFUND_LESSON_LIMIT lessons and REFUND_MOCK_LIMIT mocks on
 *    a course, REFUND_BUNDLE_MOCK_LIMIT submitted mocks on a bundle.
 *  - These are counters, not locks. Nothing here stops anyone watching anything —
 *    it only decides whether the refund button is still there.
 */

export const REFUND_WINDOW_DAYS = 3;
export const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Lessons a student may play while keeping the refund alive. */
export const REFUND_LESSON_LIMIT = 5;

/** Mock exams a student may start while keeping a course refund alive. */
export const REFUND_MOCK_LIMIT = 1;

/**
 * Mock exams a bundle holder may submit while keeping the refund alive. A
 * bundle has no lessons, so a single submitted sitting ends it — the answers
 * are the value, and once they are graded the mock has been used.
 */
export const REFUND_BUNDLE_MOCK_LIMIT = 0;

/** The only item types the 3-day guarantee covers. */
export const REFUNDABLE_ITEM_TYPES = ["course", "mock-bundle"] as const;
export type RefundableItemType = (typeof REFUNDABLE_ITEM_TYPES)[number];

/** Why an item type is outside the guarantee, for the customer-facing copy. */
export const NOT_REFUNDABLE_REASON: Record<string, string> = {
  resource: "Downloadable resources are non-refundable once purchased.",
  seminar: "Seminar seats are non-refundable once booked.",
};

export const UNKNOWN_ITEM_REASON =
  "This item is not covered by the 3-day refund guarantee.";

/**
 * Why the student is asking for their money back. Collected so refunds can be
 * grouped and spotted early — a spike in any one of these is a signal about the
 * product, not just about a customer.
 *
 * There is no "rather not say" escape hatch on the list. A student who finds
 * none of these fits writes what happened in their own words instead, so staff
 * always get something they can act on rather than a blank row.
 */
export const REFUND_REASONS = [
  "not_as_expected",
  "level_mismatch",
  "quality_concerns",
  "technical_issues",
  "accidental_purchase",
  "duplicate_purchase",
  "no_longer_needed",
  "other",
] as const;

export type RefundReason = (typeof REFUND_REASONS)[number];

/** What staff see when a claim carries a written explanation instead of a code. */
export const NO_REASON_CODE_LABEL = "Explained in their own words";

export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  not_as_expected: "The course was not what I expected",
  level_mismatch: "The level was too easy or too hard for me",
  quality_concerns: "I had concerns about the content quality",
  technical_issues: "Videos would not play, or I hit technical problems",
  accidental_purchase: "I bought this by accident",
  duplicate_purchase: "I ended up buying this more than once",
  no_longer_needed: "I no longer need it",
  other: "Something else",
};

export const REFUND_REASON_MAX_LENGTH = 1000;

export function isRefundReason(value: unknown): value is RefundReason {
  return typeof value === "string" && (REFUND_REASONS as readonly string[]).includes(value);
}

/** The stored code, or `""` when the student explained in their own words. */
export function normalizeRefundReason(value: unknown): RefundReason | "" {
  const raw = typeof value === "string" ? value.trim() : "";
  return isRefundReason(raw) ? raw : "";
}

export function refundReasonLabel(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return isRefundReason(raw) ? REFUND_REASON_LABELS[raw] : NO_REASON_CODE_LABEL;
}

/**
 * The one rule for a claim's reason: either a code from the list, or a written
 * explanation — never neither. Returns `null` when a claim arrives with
 * nothing, so the caller can turn that into a "tell us why" prompt instead of
 * filing a blank reason. Shared by the claim form and the API so both agree.
 */
export function resolveRefundReason(input: {
  reasonCode?: unknown;
  reason?: unknown;
}): { reasonCode: RefundReason | ""; reason: string } | null {
  const reasonCode = normalizeRefundReason(input.reasonCode);
  const written =
    typeof input.reason === "string" ? input.reason.trim().slice(0, REFUND_REASON_MAX_LENGTH) : "";
  if (!reasonCode && !written) return null;
  return { reasonCode, reason: written };
}

export type RefundForfeitReason = "lessons" | "mock" | "manual";

export type RefundStatus =
  | "refundable"
  | "pending"
  | "approved"
  | "refunded"
  | "declined"
  | "expired"
  | "forfeited"
  | "ineligible";

export const FORFEIT_REASON_TEXT: Record<RefundForfeitReason, string> = {
  lessons: `You played more than ${REFUND_LESSON_LIMIT} lessons, so the ${REFUND_WINDOW_DAYS}-day refund is no longer available.`,
  mock: `You took more than ${REFUND_MOCK_LIMIT} mock exam, so the ${REFUND_WINDOW_DAYS}-day refund is no longer available.`,
  manual: "The refund for this purchase was already claimed and closed.",
};

/** Bundle wording differs: a bundle has no lessons and one sitting ends it. */
export const BUNDLE_FORFEIT_TEXT: Record<RefundForfeitReason, string> = {
  lessons: "This purchase is no longer refundable.",
  mock: `You submitted a mock exam, so the ${REFUND_WINDOW_DAYS}-day refund is no longer available.`,
  manual: "The refund for this purchase was already claimed and closed.",
};

export type RefundView = {
  orderId: string;
  status: RefundStatus;
  /** The claim button is only rendered when this is true. */
  canClaim: boolean;
  /** When the 3-day window shuts. null once it has passed or was forfeited. */
  windowEndsAt: string | null;
  forfeited: boolean;
  forfeitReason: RefundForfeitReason | null;
  lessonsPlayed: number;
  mockTestsPlayed: number;
  lessonsRemaining: number;
  mocksRemaining: number;
  requestId: string | null;
  requestStatus: string | null;
  amount: number;
  currency: string;
  completedAt: string | null;
  /** The item type the order was for, so the UI can label the right allowance. */
  itemType: string;
  /** The limits actually applied, which differ for a course and a bundle. */
  lessonLimit: number;
  mockLimit: number;
  message: string;
};

/** The mock limit that applies to a given item type. */
export function mockLimitFor(itemType: string): number {
  return itemType === "mock-bundle" ? REFUND_BUNDLE_MOCK_LIMIT : REFUND_MOCK_LIMIT;
}

/** The lesson limit that applies to a given item type. Bundles have none. */
export function lessonLimitFor(itemType: string): number {
  return itemType === "mock-bundle" ? 0 : REFUND_LESSON_LIMIT;
}

export function isRefundableItemType(itemType: string): boolean {
  return (REFUNDABLE_ITEM_TYPES as readonly string[]).includes(itemType);
}

export function refundWindowEnds(completedAt?: Date | string | null): Date | null {
  if (!completedAt) return null;
  const start = completedAt instanceof Date ? completedAt : new Date(completedAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + REFUND_WINDOW_MS);
}

export function lessonsUntilForfeit(lessonsPlayed: number, limit = REFUND_LESSON_LIMIT): number {
  return Math.max(0, limit - lessonsPlayed);
}

export function mocksUntilForfeit(mockTestsPlayed: number, limit = REFUND_MOCK_LIMIT): number {
  return Math.max(0, limit - mockTestsPlayed);
}

/**
 * The one place the usage limits are turned into a verdict. Both the write path
 * (which stamps the forfeit on the enrollment) and the read path (which decides
 * whether the button is still there) call this, so a claim can never be gated on
 * a stale or missing flag. Lessons take precedence over mocks.
 */
export function forfeitReasonFor(
  lessonsPlayed: number,
  mockTestsPlayed: number,
  limits: { lessonLimit?: number; mockLimit?: number } = {}
): RefundForfeitReason | null {
  const lessonLimit = limits.lessonLimit ?? REFUND_LESSON_LIMIT;
  const mockLimit = limits.mockLimit ?? REFUND_MOCK_LIMIT;
  if (lessonsPlayed > lessonLimit) return "lessons";
  if (mockTestsPlayed > mockLimit) return "mock";
  return null;
}

/**
 * Single decision point for whether a completed order can still be refunded.
 * Precedence matters: money already on its way out beats an expired window.
 */
export function resolveRefundView(input: {
  orderId: string;
  orderStatus: string;
  itemType: string;
  amount: number;
  currency: string;
  completedAt: Date | string | null;
  lessonsPlayed: number;
  mockTestsPlayed: number;
  forfeitedAt: Date | string | null;
  forfeitReason: RefundForfeitReason | null;
  request?: { id: string; status: string } | null;
  now?: Date;
}): RefundView {
  const now = input.now ?? new Date();
  const itemType = input.itemType || "";
  const lessonsPlayed = input.lessonsPlayed ?? 0;
  const mockTestsPlayed = input.mockTestsPlayed ?? 0;
  const request = input.request ?? null;
  const lessonLimit = lessonLimitFor(itemType);
  const mockLimit = mockLimitFor(itemType);
  const isBundle = itemType === "mock-bundle";
  /**
   * Recomputed from the counters rather than read off the enrollment, so a row
   * that predates the feature — or one a failed write left un-stamped — still
   * cannot be claimed.
   */
  const derivedForfeit = forfeitReasonFor(lessonsPlayed, mockTestsPlayed, {
    lessonLimit,
    mockLimit,
  });
  const forfeitText = isBundle ? BUNDLE_FORFEIT_TEXT : FORFEIT_REASON_TEXT;

  const base = {
    orderId: input.orderId,
    amount: input.amount ?? 0,
    currency: input.currency || "USD",
    completedAt: input.completedAt ? new Date(input.completedAt).toISOString() : null,
    lessonsPlayed,
    mockTestsPlayed,
    lessonsRemaining: lessonsUntilForfeit(lessonsPlayed, lessonLimit),
    mocksRemaining: mocksUntilForfeit(mockTestsPlayed, mockLimit),
    requestId: request?.id ?? null,
    requestStatus: request?.status ?? null,
    itemType,
    lessonLimit,
    mockLimit,
  };

  /**
   * `forfeitReason` is passed in rather than echoed, because the reason that
   * decided the status is not always the one stored on the enrollment — a
   * counter-derived verdict has to win over a stale flag.
   */
  const finish = (
    status: RefundStatus,
    message: string,
    canClaim: boolean,
    windowEndsAt: Date | null,
    forfeitReason: RefundForfeitReason | null = null
  ): RefundView => ({
    ...base,
    status,
    canClaim,
    windowEndsAt: windowEndsAt ? windowEndsAt.toISOString() : null,
    forfeited: forfeitReason !== null,
    forfeitReason,
    message,
  });

  if (input.orderStatus === "refunded") {
    return finish("refunded", "This purchase has already been refunded.", false, null);
  }

  if (input.orderStatus !== "completed") {
    return finish("ineligible", "Only completed purchases can be refunded.", false, null);
  }

  if (request && (request.status === "pending" || request.status === "approved" || request.status === "refunded")) {
    const message =
      request.status === "pending"
        ? "Your refund request is with us — we will process it shortly."
        : request.status === "approved"
          ? "Your refund is approved and on its way to your original payment method."
          : "This purchase has already been refunded.";
    return finish(request.status as RefundStatus, message, false, null);
  }

  /**
   * Resources and seminars sit outside the guarantee entirely. Checked after any
   * live request so a claim already in flight still reports its real state, but
   * ahead of the window so no new claim can ever be raised against them.
   */
  if (!isRefundableItemType(itemType)) {
    return finish(
      "ineligible",
      NOT_REFUNDABLE_REASON[itemType] ?? UNKNOWN_ITEM_REASON,
      false,
      null
    );
  }

  if (input.forfeitedAt || derivedForfeit) {
    const reason = derivedForfeit ?? input.forfeitReason ?? "manual";
    return finish("forfeited", forfeitText[reason], false, null, reason);
  }

  const endsAt = refundWindowEnds(input.completedAt);
  if (!endsAt) {
    return finish("ineligible", "We could not work out when this purchase completed.", false, null);
  }

  if (now.getTime() > endsAt.getTime()) {
    return finish("expired", "The 3-day refund window for this purchase has closed.", false, endsAt);
  }

  return finish(
    "refundable",
    `You can claim a full refund until ${endsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`,
    true,
    endsAt
  );
}
