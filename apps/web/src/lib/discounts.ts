import "server-only";

import { connectDb } from "@/lib/db";
import { Discount, type DiscountDoc } from "@/lib/models/discount";
import { CourseWishlist } from "@/lib/models/wishlist";
import { Order } from "@/lib/models/order";
import type { Product } from "@/lib/products";
import {
  appliesInCurrency,
  priceFrom,
  type DiscountCandidate,
  type PricedDiscount,
} from "@/lib/discount-math";

export type ResolvedPrice = PricedDiscount;

export class DiscountError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "DiscountError";
  }
}

export type DiscountUser = {
  id: string;
  email: string;
};

function inWindow(d: DiscountDoc, now: Date): boolean {
  if (d.startsAt && d.startsAt.getTime() > now.getTime()) return false;
  if (d.endsAt && d.endsAt.getTime() < now.getTime()) return false;
  return true;
}

function scopeMatches(d: DiscountDoc, product: Product): boolean {
  if (d.appliesTo !== "all" && d.appliesTo !== product.itemType) return false;
  if (d.scope === "selected") {
    return (d.courseIds ?? []).some((id) => id.toString() === product.itemId);
  }
  return true;
}

async function audienceMatches(
  d: DiscountDoc,
  user: DiscountUser,
  product: Product,
): Promise<boolean> {
  if (d.audience === "everyone") return true;

  if (d.audience === "emails") {
    const email = user.email.toLowerCase();
    return (d.emails ?? []).some((e) => e.toLowerCase() === email);
  }

  if (d.audience === "new-users") {
    // Existing promotional records should remain available to returning buyers.
    return true;
  }

  if (d.audience === "wishlist") {
    if (product.itemType !== "course") return false;
    const onList = await CourseWishlist.exists({
      course: product.itemId,
      $or: [{ user: user.id }, { email: user.email.toLowerCase() }],
    });
    return !!onList;
  }

  return false;
}

async function withinUsageCaps(
  d: DiscountDoc,
  user: DiscountUser,
  excludeOrderId?: string,
): Promise<boolean> {
  const idFilter =
    excludeOrderId && /^[a-f\d]{24}$/i.test(excludeOrderId) ? { _id: { $ne: excludeOrderId } } : {};
  const statuses = { $in: ["pending", "completed"] as const };

  if (typeof d.maxRedemptions === "number" && d.maxRedemptions > 0) {
    const total = await Order.countDocuments({
      ...idFilter,
      discountId: d._id,
      status: statuses,
    });
    if (total >= d.maxRedemptions) return false;
  }

  if (typeof d.maxUsesPerUser === "number" && d.maxUsesPerUser > 0) {
    const mine = await Order.countDocuments({
      ...idFilter,
      discountId: d._id,
      user: user.id,
      status: statuses,
    });
    if (mine >= d.maxUsesPerUser) return false;
  }

  return true;
}

async function toCandidate(
  d: DiscountDoc,
  user: DiscountUser,
  product: Product,
  now: Date,
  excludeOrderId?: string,
  requireCode = false,
): Promise<DiscountCandidate | null> {
  if (!d.active) return null;
  if (requireCode && !d.code) return null;
  if (!requireCode && d.code) return null;
  if (!inWindow(d, now)) return null;
  if (!scopeMatches(d, product)) return null;
  if (!(await audienceMatches(d, user, product))) return null;
  if (!(await withinUsageCaps(d, user, excludeOrderId))) return null;
  return {
    id: d._id.toString(),
    label: d.name,
    type: d.type as "percent" | "fixed",
    value: d.value,
    currency: d.currency ?? "USD",
    code: d.code ?? undefined,
  };
}

export async function resolvePrice(input: {
  user: DiscountUser;
  product: Product;
  amount: number;
  currency: string;
  code?: string | null;
  excludeOrderId?: string;
}): Promise<ResolvedPrice> {
  await connectDb();

  const { user, product, amount, currency } = input;
  const now = new Date();
  const candidates: DiscountCandidate[] = [];

  // The order this price belongs to must never count against its own usage caps.
  // A checkout preview that counted a still-pending order would drop the
  // discount the shopper already holds the moment they came back from the
  // payment gateway, and report their code as unusable.
  const excludeOrderId = input.excludeOrderId ?? (await selfOrderId(user.id, product.itemId));

  const isCourse = product.itemType === "course";

  // Per-course waitlist grant.
  if (isCourse) {
    const pct = product.wishlistDiscountPercent ?? 0;
    if (pct > 0) {
      const onList = await CourseWishlist.exists({
        course: product.itemId,
        $or: [{ user: user.id }, { email: user.email.toLowerCase() }],
      });
      if (onList) {
        candidates.push({
          label: `Waitlist discount (${pct}% off)`,
          type: "percent",
          value: pct,
        });
      }
    }
  }

  const rules = await Discount.find({ active: true }).lean();
  for (const d of rules) {
    if (typeof d.minSubtotal === "number" && d.minSubtotal > 0 && amount < d.minSubtotal) {
      continue;
    }
    const candidate = await toCandidate(d, user, product, now, excludeOrderId);
    if (candidate) candidates.push(candidate);
  }

  const code = String(input.code ?? "")
    .trim()
    .toUpperCase();
  if (code) {
    const doc = rules.find((d) => (d.code ?? "").toUpperCase() === code);
    if (!doc) throw new DiscountError("This promo code isn't valid.");
    if (typeof doc.minSubtotal === "number" && doc.minSubtotal > 0 && amount < doc.minSubtotal) {
      throw new DiscountError("This promo code requires a higher order subtotal.");
    }
    const candidate = await toCandidate(doc, user, product, now, excludeOrderId, true);
    if (!candidate) throw new DiscountError("This promo code can't be applied to your order.");
    // A fixed amount written in another currency is worth nothing here. Saying so
    // beats accepting the code and quietly charging the full price.
    if (!appliesInCurrency(candidate, currency)) {
      throw new DiscountError(
        `This promo code is worth ${candidate.currency}, but this checkout is in ${currency}.`,
      );
    }
    candidates.push(candidate);
  }

  return priceFrom(candidates, amount, currency);
}

/** The caller's own still-open order for this item, if there is one. */
async function selfOrderId(userId: string, itemId: string): Promise<string | undefined> {
  const order = await Order.findOne({
    user: userId,
    "items.itemId": itemId,
    status: { $in: ["pending", "completed"] },
  })
    .select("_id")
    .lean();
  return order?._id?.toString();
}

/**
 * Public listing price: the best active, code-less discount for an item,
 * ignoring audience and usage caps so every visitor sees the same promo price.
 * Used by marketing surfaces (home/programs listings, nav menu), never for checkout.
 */
export function listingPrice(
  rules: DiscountDoc[],
  product: Pick<Product, "itemType" | "itemId">,
  amount: number,
  currency: string,
): ResolvedPrice {
  const now = new Date();
  const candidates: DiscountCandidate[] = [];

  for (const d of rules) {
    if (!d.active || d.code) continue;
    if (!inWindow(d, now)) continue;
    if (d.appliesTo !== "all" && d.appliesTo !== product.itemType) continue;
    if (
      d.scope === "selected" &&
      !(d.courseIds ?? []).some((id) => id.toString() === product.itemId)
    ) {
      continue;
    }
    if (typeof d.minSubtotal === "number" && d.minSubtotal > 0 && amount < d.minSubtotal) {
      continue;
    }
    candidates.push({
      id: d._id.toString(),
      label: d.name,
      type: d.type as "percent" | "fixed",
      value: d.value,
      currency: d.currency ?? "USD",
    });
  }

  return priceFrom(candidates, amount, currency);
}

/** Active discounts fetched once so a whole listing can be priced in memory. */
export async function getPublicDiscountRules(): Promise<DiscountDoc[]> {
  await connectDb();
  return Discount.find({ active: true }).lean();
}
