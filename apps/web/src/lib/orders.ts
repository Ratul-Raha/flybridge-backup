import "server-only";

import { connectDb } from "@/lib/db";
import { Order, type OrderDoc, type OrderItemType } from "@/lib/models/order";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { Course } from "@/lib/models/course";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { Resource } from "@/lib/models/resource";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";
import { MockTestEnrollment } from "@/lib/models/mock-test-enrollment";
import { emitEvent } from "@/lib/events/emit";
import { isMetaPurchaseEnabled, sendMetaPurchase } from "@/lib/meta-capi";
import { resolveProduct, priceInCurrency, type Product } from "@/lib/products";
import { resolveCoursePrice } from "@/lib/course-discount";
import { resolveWishlistDiscount } from "@/lib/wishlist-discount";
import { roundMoney } from "@/lib/wishlist";
import { isStripeConfigured, createCheckoutSession } from "@/lib/payments/stripe";
import { isEPSConfigured, createEPSPayment } from "@/lib/payments/eps";
import type { EventPayload } from "@/lib/events/types";

export type OrderUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

/**
 * A problem with this order rather than with the server, so API routes can hand
 * the message back to the buyer instead of reporting a failure.
 */
export class OrderError extends Error {
  readonly status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

function userPayload(u: OrderUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    accountType: "user",
    subscription: "free",
  } as EventPayload["user"];
}

function serializeOrder(order: OrderDoc) {
  return {
    id: order._id.toString(),
    subtotal: order.subtotal ?? 0,
    discountAmount: order.discountAmount ?? 0,
    discountCode: order.discountCode ?? null,
    discountLabel: order.discountLabel ?? null,
    total: order.total,
    currency: order.currency,
    status: order.status,
    items: order.items.map((i) => ({
      itemType: i.itemType,
      itemId: i.itemId,
      title: i.title ?? "",
      price: i.price,
    })),
  };
}

export async function isAlreadyFulfilled(
  itemType: OrderItemType,
  itemId: string,
  user: OrderUser
): Promise<boolean> {
  await connectDb();

  if (itemType === "course") {
    const enrollment = await CourseEnrollment.findOne({
      user: user.id,
      course: itemId,
      // An enrollment a refund expired does not count as fulfilled — otherwise a
      // refunded free course could never be enrolled in again.
      status: "active",
    });
    return !!enrollment;
  }

  if (itemType === "seminar") {
    const registration = await SeminarRegistration.findOne({
      seminar: itemId,
      email: user.email,
    });
    return !!registration;
  }

  if (itemType === "mock-bundle") {
    const enrollment = await MockTestEnrollment.findOne({
      user: user.id,
      bundle: itemId,
      // An enrollment a refund expired does not count as fulfilled.
      status: "active",
    });
    return !!enrollment;
  }

  return false;
}

export async function fulfillFreeItem(
  product: Product,
  user: OrderUser
): Promise<void> {
  await connectDb();

  if (product.itemType === "course") {
    const course = await Course.findById(product.itemId);
    if (!course) throw new Error("Course not found");

    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { user: user.id, course: course._id },
      {
        $setOnInsert: { user: user.id, course: course._id },
        $set: {
          status: "active",
          lessonsPlayed: 0,
          lessonsOpened: [],
          mockTestsPlayed: 0,
          refundForfeitedAt: null,
          refundForfeitedReason: null,
        },
      },
      { upsert: true, new: true }
    );

    await emitEvent("course.enrolled", {
      enrollmentId: enrollment._id.toString(),
      user: userPayload(user),
      course: {
        id: course._id.toString(),
        slug: course.slug,
        title: course.title,
        price: course.price,
      },
    });
  }

  if (product.itemType === "seminar") {
    const seminar = await Seminar.findById(product.itemId);
    if (!seminar) throw new Error("Seminar not found");

    const registration = await SeminarRegistration.findOneAndUpdate(
      { seminar: seminar._id, email: user.email },
      {
        $setOnInsert: {
          seminar: seminar._id,
          user: user.id,
          name: user.name,
          phone: user.phone ?? "",
          email: user.email,
        },
      },
      { upsert: true, new: true }
    );

    await emitEvent("seminar.registration_created", {
      registrationId: registration._id.toString(),
      user: {
        id: user.id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone ?? null,
      },
      seminar: {
        id: seminar._id.toString(),
        title: seminar.title,
        description: seminar.description,
        dateTime: seminar.dateTime.toISOString(),
        duration: seminar.duration,
        type: seminar.type,
        price: seminar.price,
        url: seminar.url,
        image: seminar.image,
      },
    });
  }

  if (product.itemType === "mock-bundle") {
    const bundle = await MockTestBundle.findById(product.itemId);
    if (!bundle) throw new Error("Product not found");

    const enrollment = await MockTestEnrollment.findOneAndUpdate(
      { user: user.id, bundle: bundle._id },
      {
        $setOnInsert: { user: user.id, bundle: bundle._id },
        $set: {
          status: "active",
          refundForfeitedAt: null,
          refundForfeitedReason: null,
        },
      },
      { upsert: true, new: true }
    );

    await emitEvent("mock-bundle.purchased", {
      enrollmentId: enrollment._id.toString(),
      user: userPayload(user),
      bundle: {
        id: bundle._id.toString(),
        title: bundle.title,
        price: bundle.price,
      },
    });
  }
}

export async function createOrder(input: {
  user: OrderUser;
  itemType: OrderItemType;
  itemId: string;
  currency?: string;
}): Promise<{ order: OrderDoc | null; requiresPayment: boolean; duplicate: boolean }> {
  await connectDb();

  const product = await resolveProduct(input.itemType, input.itemId);
  if (!product) throw new Error("Product not found");

  const { amount, currency } = priceInCurrency(product, input.currency);

  // A course can only be bought once. The gate is the account when there is
  // one, but a buyer who is signed out — or signed in as a different account —
  // is still recognised by the email on their order, so the same person is never
  // charged twice for it.
  const email = input.user.email.toLowerCase();
  const existing = await Order.findOne({
    items: { $elemMatch: { itemType: product.itemType, itemId: product.itemId } },
    status: { $in: ["completed", "pending"] },
    $or: [{ user: input.user.id }, { email }],
  });
  if (existing && existing.user?.toString() !== input.user.id) {
    throw new OrderError(
      "You have already purchased this with that email. Sign in with it to continue."
    );
  }

  // The course's own discount, if it is running. It has no audience and no
  // usage cap, so everyone checking out is charged the same price they were
  // shown, whether or not they were signed in when they saw it.
  const priced =
    product.itemType === "course"
      ? resolveCoursePrice(amount, product.discount)
      : { price: amount, originalPrice: null, savings: 0, label: null };

  if (amount === 0) {
    if (await isAlreadyFulfilled(product.itemType, product.itemId, input.user)) {
      return { order: null, requiresPayment: false, duplicate: true };
    }

    await fulfillFreeItem(product, input.user);
    return { order: null, requiresPayment: false, duplicate: false };
  }

  if (priced.price === 0) {
    if (await isAlreadyFulfilled(product.itemType, product.itemId, input.user)) {
      return { order: null, requiresPayment: false, duplicate: true };
    }
    await fulfillFreeItem(product, input.user);
    return { order: null, requiresPayment: false, duplicate: false };
  }

  // A waitlist member gets the course's wishlist discount on top of the general
  // discount. It stacks sequentially: the general discount lowers the list price
  // first, then the wishlist percent takes a further cut off that price.
  const wishlist = await resolveWishlistDiscount({
    itemType: product.itemType,
    itemId: product.itemId,
    userId: input.user.id,
    email: input.user.email,
    price: priced.price,
  });

  const resolved = {
    subtotal: amount,
    discount: roundMoney(priced.savings + (wishlist?.amount ?? 0)),
    total: wishlist?.price ?? priced.price,
    label:
      priced.label && wishlist
        ? `${priced.label} · Wishlist ${wishlist.percent}%`
        : wishlist
          ? `Wishlist ${wishlist.percent}%`
          : priced.label,
  };

  if (existing) {
    if (existing.status === "pending") {
      const doc = existing as OrderDoc & { save(): Promise<unknown> };
      const item = doc.items[0];
      if (
        item &&
        (doc.total !== resolved.total ||
          item.price !== resolved.total ||
          (doc.subtotal ?? 0) !== resolved.subtotal ||
          (doc.discountAmount ?? 0) !== resolved.discount)
      ) {
        item.title = product.title;
        item.price = resolved.total;
        doc.subtotal = resolved.subtotal;
        doc.discountAmount = resolved.discount;
        doc.discountCode = undefined;
        doc.discountLabel = resolved.label;
        doc.total = resolved.total;
        doc.currency = currency;
        await doc.save();
      }
    }
    return {
      order: existing as OrderDoc & { save(): Promise<unknown> },
      requiresPayment: existing.status === "pending",
      duplicate: true,
    };
  }

  let order: OrderDoc | null;
  try {
    order = await Order.create({
      user: input.user.id,
      email: input.user.email,
      items: [
        {
          itemType: product.itemType,
          itemId: product.itemId,
          title: product.title,
          price: resolved.total,
        },
      ],
      subtotal: resolved.subtotal,
      discountAmount: resolved.discount,
      discountLabel: resolved.label ?? undefined,
      total: resolved.total,
      currency,
      status: "pending",
    });
  } catch (error) {
    // Duplicate key: a concurrent checkout claimed this user+item first.
    if ((error as { code?: number })?.code === 11000) {
      const winner = await Order.findOne({
        user: input.user.id,
        "items.itemId": product.itemId,
        status: { $in: ["pending", "completed"] },
      });
      if (winner) {
        return {
          order: winner as OrderDoc & { save(): Promise<unknown> },
          requiresPayment: winner.status === "pending",
          duplicate: true,
        };
      }
    }
    throw error;
  }
  if (!order) throw new Error("Failed to create order");

  await emitEvent("order.created", {
    order: serializeOrder(order),
    user: userPayload(input.user),
  });

  return { order, requiresPayment: true, duplicate: false };
}

/**
 * Mints a fresh gateway session for an existing (pending) order and updates the
 * order's gateway references in place. Used both when an order is first placed
 * and when a buyer comes back to finish an abandoned checkout. Returns the URL
 * the browser should be sent to; throws an `OrderError` when the gateway is not
 * configured for the order's currency.
 */
export async function initiateOrderPayment(opts: {
  order: OrderDoc & { save(): Promise<unknown> };
  origin: string;
  customer: OrderUser;
  ipAddress?: string;
}): Promise<{ url: string }> {
  const order = opts.order;
  const item = order.items[0];
  if (!item) throw new OrderError("Order has no items", 400);

  let cancelPath = "/dashboard";
  if (item.itemType === "course") {
    const c = await Course.findById(item.itemId)
      .select("slug")
      .lean<{ slug?: string } | null>();
    if (c?.slug) cancelPath = `/programs/${c.slug}/checkout`;
  } else if (item.itemType === "seminar") {
    cancelPath = `/seminars/${item.itemId}`;
  } else if (item.itemType === "resource") {
    cancelPath = `/resources/${item.itemId}`;
  } else if (item.itemType === "mock-bundle") {
    cancelPath = `/mock-tests/${item.itemId}`;
  }

  const currency = (order.currency ?? "USD").toUpperCase();
  let url: string;

  if (currency === "BDT") {
    if (!(await isEPSConfigured())) {
      throw new OrderError(
        "BDT payments are not set up yet. Please choose another method or try again later.",
        503
      );
    }
    const payment = await createEPSPayment({
      order,
      origin: opts.origin,
      customer: {
        name: opts.customer.name,
        email: opts.customer.email,
        phone: opts.customer.phone ?? null,
      },
      cancelPath,
      ipAddress: opts.ipAddress,
    });
    order.gateway = "eps";
    order.gatewayRef = payment.transactionId;
    order.merchantTransactionId = payment.merchantTransactionId;
    order.gatewayMode = payment.mode;
    url = payment.url;
  } else {
    if (!(await isStripeConfigured())) {
      throw new OrderError("Payments are not configured yet. Please try again later.", 503);
    }
    const checkout = await createCheckoutSession(order, {
      origin: opts.origin,
      email: opts.customer.email,
      cancelPath,
    });
    order.gateway = "stripe";
    order.gatewayRef = checkout.sessionId;
    order.gatewayMode = checkout.mode;
    url = checkout.url;
  }

  await order.save();
  return { url };
}

export type HydratedOrder = OrderDoc & { save(): Promise<unknown> };

export async function fulfillOrder(
  order: HydratedOrder,
  user?: OrderUser
): Promise<void> {
  await connectDb();

  if (order.status === "completed") return;
  const item = order.items[0];
  if (!item) return;

  const buyer = user ?? {
    id: order.user.toString(),
    name: order.email?.split("@")[0] ?? "",
    email: order.email ?? "",
    phone: null,
  };

  let purchasedContent: { id: string; title?: string } | null = null;

  if (item.itemType === "course") {
    const course = await Course.findById(item.itemId);
    if (!course) throw new Error("Course not found");
    purchasedContent = { id: course.slug, title: course.title };

    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { user: order.user, course: course._id },
      {
        // Only the required keys live in $setOnInsert — overlapping paths across
        // the two operators are a write error, and $set covers the insert too.
        $setOnInsert: { user: order.user, course: course._id },
        // A new purchase re-opens the refund window: reactivates an enrollment a
        // previous refund expired, and clears the usage state so the old
        // forfeit and the old lesson set cannot carry into this order.
        $set: {
          order: order._id,
          status: "active",
          lessonsPlayed: 0,
          lessonsOpened: [],
          mockTestsPlayed: 0,
          refundForfeitedAt: null,
          refundForfeitedReason: null,
        },
      },
      { upsert: true, new: true }
    );

    await emitEvent("course.enrolled", {
      enrollmentId: enrollment._id.toString(),
      user: userPayload(buyer),
      course: {
        id: course._id.toString(),
        slug: course.slug,
        title: course.title,
        price: course.price,
      },
    });
  }

  if (item.itemType === "resource") {
    const resource = await Resource.findById(item.itemId);
    if (!resource) throw new Error("Resource not found");
  }

  if (item.itemType === "seminar") {
    const seminar = await Seminar.findById(item.itemId);
    if (!seminar) throw new Error("Seminar not found");

    const registration = await SeminarRegistration.findOneAndUpdate(
      { seminar: seminar._id, email: order.email },
      {
        $setOnInsert: {
          seminar: seminar._id,
          user: order.user,
          name: buyer.name,
          phone: buyer.phone ?? "",
          email: order.email,
        },
      },
      { upsert: true, new: true }
    );

    await emitEvent("seminar.registration_created", {
      registrationId: registration._id.toString(),
      user: {
        id: order.user.toString(),
        name: registration.name,
        email: registration.email,
        phone: registration.phone ?? null,
      },
      seminar: {
        id: seminar._id.toString(),
        title: seminar.title,
        description: seminar.description,
        dateTime: seminar.dateTime.toISOString(),
        duration: seminar.duration,
        type: seminar.type,
        price: seminar.price,
        url: seminar.url,
        image: seminar.image,
      },
    });
  }

  if (item.itemType === "mock-bundle") {
    const bundle = await MockTestBundle.findById(item.itemId);
    if (!bundle) throw new Error("Bundle not found");

    const enrollment = await MockTestEnrollment.findOneAndUpdate(
      { user: order.user, bundle: bundle._id },
      {
        $setOnInsert: { user: order.user, bundle: bundle._id },
        // A new purchase re-opens the window and reactivates an enrollment a
        // previous refund expired, clearing the forfeit it stamped.
        $set: {
          order: order._id,
          status: "active",
          refundForfeitedAt: null,
          refundForfeitedReason: null,
        },
      },
      { upsert: true, new: true }
    );

    await emitEvent("mock-bundle.purchased", {
      enrollmentId: enrollment._id.toString(),
      user: userPayload(buyer),
      bundle: {
        id: bundle._id.toString(),
        title: bundle.title,
        price: bundle.price,
      },
    });
  }

  order.status = "completed";
  order.completedAt = order.completedAt ?? new Date();
  await order.save();

  const fulfilledPayload: EventPayload = {
    order: serializeOrder(order),
    user: userPayload(buyer),
  };

  if (item.itemType === "course") {
    const courseDoc = await Course.findById(item.itemId).select("slug title").lean();
    if (courseDoc) {
      (fulfilledPayload as Record<string, unknown>).course = {
        slug: courseDoc.slug,
        title: courseDoc.title,
      };
    }
  }

  await emitEvent("order.fulfilled", fulfilledPayload);

  if (isMetaPurchaseEnabled()) {
    await reportOrderPurchase(order, { phone: buyer.phone, content: purchasedContent });
  }
}

export type MetaReportResult = {
  reported: boolean;
  traceId?: string;
  error?: string;
};

/**
 * Sends the order's Purchase event and records the delivery outcome on the
 * order itself, so a lost conversion is visible in admin instead of only in
 * the logs. Never throws: reporting must not break a paid order.
 *
 * Meta dedupes on `event_id` (the order id), so calling this again for the same
 * order is safe — that is what makes the admin retry possible.
 */
export async function reportOrderPurchase(
  order: HydratedOrder,
  opts: { phone?: string | null; content?: { id: string; title?: string } | null } = {}
): Promise<MetaReportResult> {
  const item = order.items[0];
  if (!item) return { reported: false, error: "Order has no items" };
  if (!isMetaPurchaseEnabled()) {
    return { reported: false, error: "Meta Conversions API is not configured" };
  }

  // Courses are sent as the slug, which is what the browser pixel used, so the
  // two sides agree on content_ids. Everything else goes out as the raw item id.
  const content = opts.content ?? (await contentRef(item));
  const attribution = order.attribution;

  try {
    const traceId = await sendMetaPurchase({
      eventId: order._id.toString(),
      orderId: order._id.toString(),
      email: order.email,
      phone: opts.phone,
      value: order.total,
      currency: order.currency,
      contentIds: [content.id],
      contentName: content.title,
      fbc: attribution?.fbc,
      fbp: attribution?.fbp,
      clientIp: attribution?.ip,
      userAgent: attribution?.userAgent,
    });
    order.meta = { reported: true, reportedAt: new Date(), traceId: traceId || undefined };
    // Saved either way so admin can see reported *and* failed, not just silence.
    await order.save();
    return { reported: true, traceId: traceId || undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const detail = message.slice(0, 300);
    order.meta = { reported: false, reportedAt: new Date(), error: detail };
    await order.save().catch(() => {});
    console.error("meta purchase report failed", error);
    return { reported: false, error: detail };
  }
}

async function contentRef(
  item: OrderDoc["items"][number]
): Promise<{ id: string; title?: string }> {
  if (item.itemType === "course") {
    const course = await Course.findById(item.itemId).select("slug title").lean();
    if (course) return { id: course.slug, title: course.title };
  }
  return { id: item.itemId, title: item.title ?? undefined };
}
