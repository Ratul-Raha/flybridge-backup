import "server-only";

import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { Seminar } from "@/lib/models/seminar";
import { Resource } from "@/lib/models/resource";
import type { OrderItemType } from "@/lib/models/order";

export type Product = {
  itemType: OrderItemType;
  itemId: string;
  title: string;
  price: number;
  currency: string;
  image?: string | null;
  url?: string | null;
};

export async function resolveProduct(
  itemType: OrderItemType,
  itemId: string
): Promise<Product | null> {
  await connectDb();

  if (itemType === "course") {
    const c = await Course.findOne({ _id: itemId, published: true }).lean();
    if (!c) return null;
    return {
      itemType,
      itemId: c._id.toString(),
      title: c.title,
      price: c.price,
      currency: c.currency,
      image: c.image ?? null,
      url: `/programs/${c.slug}/learn`,
    };
  }

  if (itemType === "seminar") {
    const s = await Seminar.findById(itemId).lean();
    if (!s) return null;
    return {
      itemType,
      itemId: s._id.toString(),
      title: s.title,
      price: s.price,
      currency: "USD",
      image: s.image ?? null,
      url: s.url ?? null,
    };
  }

  if (itemType === "resource") {
    const r = await Resource.findById(itemId).lean();
    if (!r) return null;
    return {
      itemType,
      itemId: r._id.toString(),
      title: r.title,
      price: r.price,
      currency: "USD",
      image: r.thumbnail ?? null,
      url: null,
    };
  }

  return null;
}
