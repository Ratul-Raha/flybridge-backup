/**
 * Refund + access policy. Pure, so both the server routes and the client UI can
 * share the numbers and the wording without pulling the database in.
 *
 * The rule set:
 *  - A purchase is refundable for REFUND_WINDOW_DAYS after the order completed.
 *  - A refund is forfeited forever once the student crosses either usage limit:
 *    REFUND_LESSON_LIMIT lessons played, or REFUND_MOCK_LIMIT mock exams taken.
 *  - These are counters, not locks. Nothing here stops anyone watching anything —
 *    it only decides whether the refund button is still there.
 */

export const REFUND_WINDOW_DAYS = 3;
export const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Lessons a student may play while keeping the refund alive. */
export const REFUND_LESSON_LIMIT = 5;

/** Mock exams a student may take while keeping the refund alive. */
export const REFUND_MOCK_LIMIT = 1;

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
  lessons: `You played more than ${REFUND_LESSON_LIMIT} lessons, so the 3-day refund is no longer available.`,
  mock: `You took more than ${REFUND_MOCK_LIMIT} mock exam, so the 3-day refund is no longer available.`,
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
  message: string;
};

export function refundWindowEnds(completedAt?: Date | string | null): Date | null {
  if (!completedAt) return null;
  const start = completedAt instanceof Date ? completedAt : new Date(completedAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + REFUND_WINDOW_MS);
}

export function lessonsUntilForfeit(lessonsPlayed: number): number {
  return Math.max(0, REFUND_LESSON_LIMIT - lessonsPlayed);
}

export function mocksUntilForfeit(mockTestsPlayed: number): number {
  return Math.max(0, REFUND_MOCK_LIMIT - mockTestsPlayed);
}

/**
 * Single decision point for whether a completed order can still be refunded.
 * Precedence matters: money already on its way out beats an expired window.
 */
export function resolveRefundView(input: {
  orderId: string;
  orderStatus: string;
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
  const lessonsPlayed = input.lessonsPlayed ?? 0;
  const mockTestsPlayed = input.mockTestsPlayed ?? 0;
  const request = input.request ?? null;

  const base = {
    orderId: input.orderId,
    amount: input.amount ?? 0,
    currency: input.currency || "USD",
    completedAt: input.completedAt ? new Date(input.completedAt).toISOString() : null,
    lessonsPlayed,
    mockTestsPlayed,
    lessonsRemaining: lessonsUntilForfeit(lessonsPlayed),
    mocksRemaining: mocksUntilForfeit(mockTestsPlayed),
    requestId: request?.id ?? null,
    requestStatus: request?.status ?? null,
  };

  const finish = (status: RefundStatus, message: string, canClaim: boolean, windowEndsAt: Date | null): RefundView => ({
    ...base,
    status,
    canClaim,
    windowEndsAt: windowEndsAt ? windowEndsAt.toISOString() : null,
    forfeited: Boolean(input.forfeitedAt) || status === "forfeited",
    forfeitReason: input.forfeitReason ?? null,
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

  if (input.forfeitedAt) {
    const reason = input.forfeitReason ?? "manual";
    return finish("forfeited", FORFEIT_REASON_TEXT[reason], false, null);
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
