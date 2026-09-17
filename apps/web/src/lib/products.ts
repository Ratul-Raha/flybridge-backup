import "server-only";

import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { Seminar } from "@/lib/models/seminar";
import { Resource } from "@/lib/models/resource";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";
import { cleanPrices, type CurrencyPrices } from "@/lib/pricing";
import type { OrderItemType } from "@/lib/models/order";

export type Product = {
  itemType: OrderItemType;
  itemId: string;
  title: string;
  price: number;
  currency: string;
  prices?: CurrencyPrices | null;
  image?: string | null;
  url?: string | null;
  wishlistDiscountPercent?: number | null;
};

export function priceInCurrency(
  product: Product,
  currency?: string
): { amount: number; currency: string } {
  let amount = product.price;
  let code = product.currency ?? "USD";
  const target = String(currency ?? "").toUpperCase() || "USD";
  if (target === "BDT") {
    const bdt = product.prices?.BDT;
    if (typeof bdt === "number" && Number.isFinite(bdt) && bdt >= 0) {
      amount = bdt;
      code = "BDT";
    } else {
      throw new Error("No BDT price is set for this item yet.");
    }
  }
  return { amount, currency: code };
}

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
      prices: cleanPrices(c.prices),
      image: c.image ?? null,
      url: `/programs/${c.slug}/learn`,
      wishlistDiscountPercent: c.waitlistEnabled
        ? c.wishlistDiscountPercent ?? 0
        : 0,
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
      prices: cleanPrices(s.prices),
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
      prices: cleanPrices(r.prices),
      image: r.thumbnail ?? null,
      url: null,
    };
  }

  if (itemType === "mock-bundle") {
    const b = await MockTestBundle.findById(itemId).lean();
    if (!b || !b.published) return null;
    return {
      itemType,
      itemId: b._id.toString(),
      title: b.title,
      price: b.price,
      currency: b.currency,
      prices: cleanPrices(b.prices),
      image: b.image ?? null,
      url: `/mock-tests/${b._id.toString()}`,
    };
  }

  return null;
}
