import "server-only";

import { connectDb } from "@/lib/db";
import { CourseEnrollment, type CourseEnrollmentDoc } from "@/lib/models/enrollment";
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

export function buildRefundView(input: {
  order: OrderDoc;
  enrollment?: EnrollmentLike | null;
  request?: Pick<RefundRequestDoc, "_id" | "status"> | null;
  now?: Date;
}): RefundView {
  const { order, enrollment, request, now } = input;
  return resolveRefundView({
    orderId: order._id.toString(),
    orderStatus: order.status,
    amount: order.total ?? 0,
    currency: order.currency ?? "USD",
    completedAt: orderCompletedAt(order),
    lessonsPlayed: enrollment?.lessonsPlayed ?? 0,
    mockTestsPlayed: enrollment?.mockTestsPlayed ?? 0,
    forfeitedAt: enrollment?.refundForfeitedAt ?? null,
    forfeitReason: (enrollment?.refundForfeitedReason as RefundForfeitReason | null) ?? null,
    request: request ? { id: request._id.toString(), status: request.status } : null,
    now,
  });
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

  const courseIds = orders
    .map((o) => o.items.find((i) => i.itemType === "course")?.itemId)
    .filter((id): id is string => Boolean(id));

  const [enrollments, requests, courses] = await Promise.all([
    courseIds.length
      ? CourseEnrollment.find({ user: userId, course: { $in: courseIds } }).lean()
      : Promise.resolve([]),
    RefundRequest.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    courseIds.length ? Course.find({ _id: { $in: courseIds } }).select("slug").lean() : Promise.resolve([]),
  ]);

  const enrollmentByCourse = new Map(
    (enrollments as (CourseEnrollmentDoc & { _id: unknown })[]).map((e) => [
      e.course.toString(),
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

  return (orders as unknown as OrderDoc[]).map((order) => {
    const item = order.items[0];
    const courseItem = order.items.find((i) => i.itemType === "course");
    return {
      orderId: order._id.toString(),
      itemId: item?.itemId ?? "",
      itemTitle: item?.title || "Purchase",
      itemType: item?.itemType ?? "",
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      amount: order.total ?? 0,
      currency: order.currency ?? "USD",
      slug: courseItem ? (slugById.get(courseItem.itemId) ?? null) : null,
      refund: buildRefundView({
        order,
        enrollment: courseItem ? (enrollmentByCourse.get(courseItem.itemId) ?? null) : null,
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
  const enrollment = courseItem
    ? await CourseEnrollment.findOne({
        user: input.userId,
        course: courseItem.itemId,
        status: "active",
      }).lean()
    : null;

  const existing = await RefundRequest.findOne({
    order: order._id,
    status: { $in: ["pending", "approved", "refunded"] },
  });
  if (existing) {
    throw new RefundError("You already have a refund request for this purchase", 409);
  }

  const view = buildRefundView({ order, enrollment, request: null });
  if (!view.canClaim) {
    throw new RefundError(view.message, 403);
  }

  const payload = {
    user: input.userId,
    order: order._id,
    course: courseItem?.itemId ?? null,
    enrollment: enrollment?._id ?? null,
    itemId: courseItem?.itemId ?? order.items[0]?.itemId ?? "",
    itemTitle: courseItem?.title ?? order.items[0]?.title ?? "",
    amount: order.total ?? 0,
    currency: order.currency ?? "USD",
    gateway: order.gateway ?? null,
    reason: input.reason?.slice(0, 1000) ?? "",
    status: "pending" as const,
    lessonsPlayedAtClaim: enrollment?.lessonsPlayed ?? 0,
    mockTestsPlayedAtClaim: enrollment?.mockTestsPlayed ?? 0,
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
