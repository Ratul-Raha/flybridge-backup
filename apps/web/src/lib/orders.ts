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
import { resolveProduct, type Product } from "@/lib/products";
import type { EventPayload } from "@/lib/events/types";

export type OrderUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

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
        $setOnInsert: {
          user: user.id,
          course: course._id,
          status: "active",
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
        $setOnInsert: {
          user: user.id,
          bundle: bundle._id,
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

  let amount = product.price;
  let currency = product.currency ?? "USD";
  const target = String(input.currency ?? "").toUpperCase() || "USD";
  if (target === "BDT") {
    const bdt = product.prices?.BDT;
    if (typeof bdt === "number" && Number.isFinite(bdt) && bdt >= 0) {
      amount = bdt;
      currency = "BDT";
    } else {
      throw new Error("No BDT price is set for this item yet.");
    }
  }

  if (amount === 0) {
    if (await isAlreadyFulfilled(product.itemType, product.itemId, input.user)) {
      return { order: null, requiresPayment: false, duplicate: true };
    }

    await fulfillFreeItem(product, input.user);
    return { order: null, requiresPayment: false, duplicate: false };
  }

  const existing = await Order.findOne({
    user: input.user.id,
    "items.itemId": product.itemId,
    status: { $in: ["completed", "pending"] },
  });
  if (existing) {
    if (
      existing.status === "pending" &&
      existing.items[0] &&
      (existing.total !== amount || existing.items[0].price !== amount)
    ) {
      const doc = existing as OrderDoc & { save(): Promise<unknown> };
      doc.items[0].title = product.title;
      doc.items[0].price = amount;
      doc.total = amount;
      doc.currency = currency;
      await doc.save();
    }
    return {
      order: existing as OrderDoc & { save(): Promise<unknown> },
      requiresPayment: existing.status === "pending",
      duplicate: true,
    };
  }

  const order = await Order.create({
    user: input.user.id,
    email: input.user.email,
    items: [
      {
        itemType: product.itemType,
        itemId: product.itemId,
        title: product.title,
        price: amount,
      },
    ],
    total: amount,
    currency,
    status: "pending",
  });

  await emitEvent("order.created", {
    order: serializeOrder(order),
    user: userPayload(input.user),
  });

  return { order, requiresPayment: true, duplicate: false };
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

  if (item.itemType === "course") {
    const course = await Course.findById(item.itemId);
    if (!course) throw new Error("Course not found");

    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { user: order.user, course: course._id },
      {
        $setOnInsert: {
          user: order.user,
          course: course._id,
          order: order._id,
          status: "active",
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
        $setOnInsert: {
          user: order.user,
          bundle: bundle._id,
          order: order._id,
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
}
