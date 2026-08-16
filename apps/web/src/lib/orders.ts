import "server-only";

import { connectDb } from "@/lib/db";
import { Order, type OrderDoc, type OrderItemType } from "@/lib/models/order";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { Course } from "@/lib/models/course";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { emitEvent } from "@/lib/events/emit";
import { resolveProduct } from "@/lib/products";
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

export async function createOrder(input: {
  user: OrderUser;
  itemType: OrderItemType;
  itemId: string;
}): Promise<{ order: OrderDoc; requiresPayment: boolean }> {
  await connectDb();

  const product = await resolveProduct(input.itemType, input.itemId);
  if (!product) throw new Error("Product not found");

  const order = await Order.create({
    user: input.user.id,
    email: input.user.email,
    items: [
      {
        itemType: product.itemType,
        itemId: product.itemId,
        title: product.title,
        price: product.price,
      },
    ],
    total: product.price,
    currency: product.currency,
    status: "pending",
  });

  await emitEvent("order.created", {
    order: serializeOrder(order),
    user: userPayload(input.user),
  });

  if (product.price === 0) {
    await fulfillOrder(order, input.user);
  }

  return { order, requiresPayment: product.price > 0 };
}

export async function fulfillOrder(
  order: OrderDoc & { save(): Promise<unknown> },
  user?: OrderUser
): Promise<void> {
  await connectDb();

  if (order.status === "paid") return;
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

  order.status = "paid";
  await order.save();

  await emitEvent("order.fulfilled", {
    order: serializeOrder(order),
    user: userPayload(buyer),
  });
}
