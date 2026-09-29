import "server-only";

import { connectDb } from "@/lib/db";
import { Types } from "mongoose";
import { CourseEnrollment, type CourseEnrollmentDoc } from "@/lib/models/enrollment";
import {
  MockTestEnrollment,
  type MockTestEnrollmentDoc,
} from "@/lib/models/mock-test-enrollment";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";
import { Course } from "@/lib/models/course";
import { Order, type OrderDoc } from "@/lib/models/order";
import { RefundRequest, type RefundRequestDoc } from "@/lib/models/refund-request";
import {
  forfeitReasonFor,
  resolveRefundView,
  type RefundForfeitReason,
  type RefundView,
} from "@/lib/refund-policy";

/** Orders completed before `completedAt` existed fall back to their last write. */
export function orderCompletedAt(order: {
  completedAt?: Date | null;
  updatedAt?: Date | null;
}): Date | null {
  return order.completedAt ?? order.updatedAt ?? null;
}

type EnrollmentLike = Pick<
  CourseEnrollmentDoc,
  | "lessonsPlayed"
  | "mockTestsPlayed"
  | "refundForfeitedAt"
  | "refundForfeitedReason"
>;

type BundleEnrollmentLike = Pick<
  MockTestEnrollmentDoc,
  "refundForfeitedAt" | "refundForfeitedReason"
>;

/** The usage figures an order carries into the policy, whichever kind it is. */
export type RefundUsage = {
  lessonsPlayed: number;
  mockTestsPlayed: number;
  forfeitedAt: Date | null;
  forfeitReason: RefundForfeitReason | null;
};

type EnrollmentDocument = CourseEnrollmentDoc & { save: () => Promise<unknown> };

/**
 * Applies the usage rules to an enrollment and persists whatever changed.
 * Called after every lesson play and every mock exam, so the refund lapses the
 * moment a limit is crossed — no scheduled job, no way to miss it.
 */
async function applyUsageRules(
  enrollment: EnrollmentDocument,
  lessonsPlayed: number,
  mockTestsPlayed: number
): Promise<void> {
  const reason = forfeitReasonFor(lessonsPlayed, mockTestsPlayed);

  enrollment.lessonsPlayed = lessonsPlayed;
  enrollment.mockTestsPlayed = mockTestsPlayed;

  if (reason && !enrollment.refundForfeitedAt) {
    enrollment.refundForfeitedAt = new Date();
    enrollment.refundForfeitedReason = reason;
  }

  await enrollment.save();
}

/**
 * Records that a student played the lesson at `flatIndex`. Counted per distinct
 * lesson, so re-watching or scrubbing back never inflates the count and it is
 * safe to call on every page load and every video range request. Skipping
 * ahead to lesson 20 costs one lesson, not twenty.
 */
export async function recordLessonPlay(input: {
  userId: string;
  courseId: string;
  flatIndex: number;
}): Promise<void> {
  try {
    await connectDb();
    const enrollment = await CourseEnrollment.findOne({
      user: input.userId,
      course: input.courseId,
      status: "active",
    });
    if (!enrollment) return;

    const opened = new Set(enrollment.lessonsOpened ?? []);
    if (opened.has(input.flatIndex)) return;

    // Enrollments created before `lessonsOpened` existed carry a high-water
    // mark with no list behind it. Seeding the set with the recorded count keeps
    // the total from going backwards on the first play after deploy — the count
    // only ever grows.
    const recorded = Math.max(0, enrollment.lessonsPlayed ?? 0);
    while (opened.size < recorded) opened.add(-1 - opened.size);

    opened.add(input.flatIndex);
    enrollment.lessonsOpened = [...opened];
    await applyUsageRules(enrollment, opened.size, enrollment.mockTestsPlayed ?? 0);
  } catch (error) {
    // Usage tracking must never break lesson playback.
    console.error("recordLessonPlay failed", error);
  }
}

/** Records a mock exam sitting. Only the first one keeps the refund alive. */
export async function recordMockTestPlay(input: {
  userId: string;
  courseId: string;
}): Promise<void> {
  try {
    await connectDb();
    const enrollment = await CourseEnrollment.findOne({
      user: input.userId,
      course: input.courseId,
      status: "active",
    });
    if (!enrollment) return;

    await applyUsageRules(
      enrollment,
      enrollment.lessonsPlayed ?? 0,
      (enrollment.mockTestsPlayed ?? 0) + 1
    );
  } catch (error) {
    console.error("recordMockTestPlay failed", error);
  }
}

/**
 * How many mock exams a bundle holder has actually submitted, keyed by bundle.
 *
 * Counted from the attempts themselves rather than from a stored tally, which
 * makes it naturally idempotent: re-submitting the same attempt, retrying after
 * a failed write, or re-grading later cannot inflate the number. Only a sitting
 * that reached the answer key counts — `in_progress` sittings are free.
 */
export async function bundleSubmissionsByBundle(
  userId: string,
  bundleIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (bundleIds.length === 0) return counts;

  await connectDb();
  const rows = await MockTestAttempt.aggregate<{ _id: string; count: number }>([
    { $match: { user: new Types.ObjectId(userId), bundle: { $in: bundleIds.map((id) => new Types.ObjectId(id)) } } },
    { $match: { status: { $in: ["submitted", "graded"] } } },
    { $group: { _id: "$bundle", count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    counts.set(row._id.toString(), row.count);
  }
  return counts;
}

/**
 * Stamps the forfeit on a bundle enrollment once a sitting has been submitted.
 * The authoritative count comes from `bundleSubmissionsByBundle`; this only
 * records when it happened, which is what the admin view shows. The first
 * submission forfeits the refund outright — REFUND_BUNDLE_MOCK_LIMIT is 0.
 */
export async function recordBundleMockSubmission(input: {
  userId: string;
  bundleId: string;
}): Promise<void> {
  try {
    await connectDb();
    const enrollment = await MockTestEnrollment.findOne({
      user: input.userId,
      bundle: input.bundleId,
      status: "active",
    });
    if (!enrollment || enrollment.refundForfeitedAt) return;

    enrollment.refundForfeitedAt = new Date();
    enrollment.refundForfeitedReason = "mock";
    await enrollment.save();
  } catch (error) {
    // Usage tracking must never break grading.
    console.error("recordBundleMockSubmission failed", error);
  }
}

/** The item a single-item order is for. Refunds only cover course and bundle. */
export function orderItemType(order: Pick<OrderDoc, "items">): string {
  return order.items?.[0]?.itemType ?? "";
}

export function courseUsageFor(enrollment?: EnrollmentLike | null): RefundUsage {
  return {
    lessonsPlayed: enrollment?.lessonsPlayed ?? 0,
    mockTestsPlayed: enrollment?.mockTestsPlayed ?? 0,
    forfeitedAt: enrollment?.refundForfeitedAt ?? null,
    forfeitReason: (enrollment?.refundForfeitedReason as RefundForfeitReason | null) ?? null,
  };
}

export function bundleUsageFor(
  enrollment?: BundleEnrollmentLike | null,
  mocksSubmitted = 0
): RefundUsage {
  return {
    lessonsPlayed: 0,
    mockTestsPlayed: mocksSubmitted,
    forfeitedAt: enrollment?.refundForfeitedAt ?? null,
    forfeitReason: (enrollment?.refundForfeitedReason as RefundForfeitReason | null) ?? null,
  };
}

export function buildRefundView(input: {
  order: OrderDoc;
  usage?: RefundUsage | null;
  request?: Pick<RefundRequestDoc, "_id" | "status"> | null;
  now?: Date;
}): RefundView {
  const { order, usage, request, now } = input;
  return resolveRefundView({
    orderId: order._id.toString(),
    orderStatus: order.status,
    itemType: orderItemType(order),
    amount: order.total ?? 0,
    currency: order.currency ?? "USD",
    completedAt: orderCompletedAt(order),
    lessonsPlayed: usage?.lessonsPlayed ?? 0,
    mockTestsPlayed: usage?.mockTestsPlayed ?? 0,
    forfeitedAt: usage?.forfeitedAt ?? null,
    forfeitReason: usage?.forfeitReason ?? null,
    request: request ? { id: request._id.toString(), status: request.status } : null,
    now,
  });
}

/**
 * Usage for one order, resolved from whichever enrollment backs it. Bundles
 * count their submitted sittings from the attempts; courses use their own
 * counters; anything else has no usage to report.
 */
export async function usageForOrder(
  userId: string,
  order: OrderDoc
): Promise<RefundUsage> {
  const itemType = orderItemType(order);

  if (itemType === "mock-bundle") {
    const bundleId = order.items?.[0]?.itemId ?? "";
    if (!bundleId) return bundleUsageFor(null, 0);
    const [enrollment, counts] = await Promise.all([
      MockTestEnrollment.findOne({ user: userId, bundle: bundleId }).lean(),
      bundleSubmissionsByBundle(userId, [bundleId]),
    ]);
    return bundleUsageFor(enrollment, counts.get(bundleId) ?? 0);
  }

  if (itemType === "course") {
    const courseId = order.items?.[0]?.itemId ?? "";
    if (!courseId) return courseUsageFor(null);
    const enrollment = await CourseEnrollment.findOne({ user: userId, course: courseId }).lean();
    return courseUsageFor(enrollment);
  }

  return courseUsageFor(null);
}

export type OrderRow = {
  orderId: string;
  itemId: string;
  itemTitle: string;
  itemType: string;
  status: string;
  createdAt: string;
  amount: number;
  currency: string;
  slug: string | null;
  refund: RefundView;
};

/** Every order the user has, with its refund standing, for the My Orders page. */
export async function orderRowsForUser(userId: string): Promise<OrderRow[]> {
  await connectDb();

  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  if (orders.length === 0) return [];

  const typed = orders as unknown as OrderDoc[];

  const itemIds = (itemType: string) =>
    typed
      .map((o) => o.items.find((i) => i.itemType === itemType)?.itemId)
      .filter((id): id is string => Boolean(id));

  const courseIds = itemIds("course");
  const bundleIds = itemIds("mock-bundle");

  const [enrollments, bundleEnrollments, submissions, requests, courses] = await Promise.all([
    courseIds.length
      ? CourseEnrollment.find({ user: userId, course: { $in: courseIds } }).lean()
      : Promise.resolve([]),
    bundleIds.length
      ? MockTestEnrollment.find({ user: userId, bundle: { $in: bundleIds } }).lean()
      : Promise.resolve([]),
    bundleSubmissionsByBundle(userId, bundleIds),
    RefundRequest.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    courseIds.length ? Course.find({ _id: { $in: courseIds } }).select("slug").lean() : Promise.resolve([]),
  ]);

  const enrollmentByCourse = new Map(
    (enrollments as (CourseEnrollmentDoc & { _id: unknown })[]).map((e) => [
      e.course.toString(),
      e,
    ])
  );
  const bundleById = new Map(
    (bundleEnrollments as (MockTestEnrollmentDoc & { _id: unknown })[]).map((e) => [
      e.bundle.toString(),
      e,
    ])
  );
  // `requests` is newest first, so the first hit for an order is the one that counts.
  const requestByOrder = new Map<string, (typeof requests)[number]>();
  for (const r of requests) {
    const key = r.order.toString();
    if (!requestByOrder.has(key)) requestByOrder.set(key, r);
  }
  const slugById = new Map(
    (courses as ({ _id: { toString(): string }; slug: string })[]).map((c) => [
      c._id.toString(),
      c.slug,
    ])
  );

  return typed.map((order) => {
    const item = order.items[0];
    const itemType = orderItemType(order);
    const courseItem = order.items.find((i) => i.itemType === "course");
    const bundleItem = order.items.find((i) => i.itemType === "mock-bundle");

    const usage: RefundUsage =
      itemType === "mock-bundle" && bundleItem
        ? bundleUsageFor(
            bundleById.get(bundleItem.itemId) ?? null,
            submissions.get(bundleItem.itemId) ?? 0
          )
        : courseUsageFor(courseItem ? (enrollmentByCourse.get(courseItem.itemId) ?? null) : null);

    return {
      orderId: order._id.toString(),
      itemId: item?.itemId ?? "",
      itemTitle: item?.title || "Purchase",
      itemType,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      amount: order.total ?? 0,
      currency: order.currency ?? "USD",
      slug: courseItem ? (slugById.get(courseItem.itemId) ?? null) : null,
      refund: buildRefundView({
        order,
        usage,
        request: requestByOrder.get(order._id.toString()) ?? null,
      }),
    };
  });
}

export class RefundError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/**
 * Creates the claim. Every condition is re-checked server-side — the button in
 * the dashboard is a convenience, not the gate.
 */
export async function claimRefund(input: {
  userId: string;
  orderId: string;
  reason?: string;
}): Promise<RefundRequestDoc> {
  await connectDb();

  const order = await Order.findOne({ _id: input.orderId, user: input.userId });
  if (!order) throw new RefundError("Order not found", 404);
  if (order.status === "refunded") throw new RefundError("This purchase is already refunded", 409);

  const courseItem = order.items.find((i) => i.itemType === "course");
  const bundleItem = order.items.find((i) => i.itemType === "mock-bundle");
  const usage = await usageForOrder(input.userId, order);

  const existing = await RefundRequest.findOne({
    order: order._id,
    status: { $in: ["pending", "approved", "refunded"] },
  });
  if (existing) {
    throw new RefundError("You already have a refund request for this purchase", 409);
  }

  const view = buildRefundView({ order, usage, request: null });
  if (!view.canClaim) {
    throw new RefundError(view.message, 403);
  }

  // The claim is only ever reachable for a covered item, so the enrollment we
  // revoke on payout is whichever one backs this order.
  const enrollmentId = courseItem
    ? (await CourseEnrollment.findOne({
        user: input.userId,
        course: courseItem.itemId,
        status: "active",
      })
        .select("_id")
        .lean())?._id
    : bundleItem
      ? (await MockTestEnrollment.findOne({
          user: input.userId,
          bundle: bundleItem.itemId,
          status: "active",
        })
          .select("_id")
          .lean())?._id
      : null;

  const payload = {
    user: input.userId,
    order: order._id,
    course: courseItem?.itemId ?? null,
    enrollment: enrollmentId ?? null,
    itemId: courseItem?.itemId ?? bundleItem?.itemId ?? order.items[0]?.itemId ?? "",
    itemTitle: courseItem?.title ?? bundleItem?.title ?? order.items[0]?.title ?? "",
    itemType: orderItemType(order),
    amount: order.total ?? 0,
    currency: order.currency ?? "USD",
    gateway: order.gateway ?? null,
    reason: input.reason?.slice(0, 1000) ?? "",
    status: "pending" as const,
    lessonsPlayedAtClaim: usage.lessonsPlayed,
    mockTestsPlayedAtClaim: usage.mockTestsPlayed,
  };

  try {
    return await RefundRequest.create(
      payload as unknown as Parameters<typeof RefundRequest.create>[0]
    );
  } catch (error) {
    // Lost a race against a second click on the same order.
    if ((error as { code?: number })?.code === 11000) {
      throw new RefundError("You already have a refund request for this purchase", 409);
    }
    throw error;
  }
}
