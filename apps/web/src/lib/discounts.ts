import "server-only";

import { connectDb } from "@/lib/db";
import { Discount, type DiscountDoc } from "@/lib/models/discount";
import { CourseWishlist } from "@/lib/models/wishlist";
import { Order } from "@/lib/models/order";
import type { Product } from "@/lib/products";

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

export type ResolvedPrice = {
  subtotal: number;
  discount: number;
  total: number;
  discountId?: string;
  code?: string;
  label?: string;
};

type Candidate = {
  id?: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  currency?: string;
  code?: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function savingsFor(candidate: Candidate, amount: number, currency: string): number | null {
  if (candidate.type === "fixed") {
    if ((candidate.currency ?? "USD").toUpperCase() !== currency.toUpperCase()) {
      return null;
    }
    return roundMoney(Math.min(candidate.value, amount));
  }
  const raw = (amount * candidate.value) / 100;
  return roundMoney(Math.min(raw, amount));
}

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
  product: Product
): Promise<boolean> {
  if (d.audience === "everyone") return true;

  if (d.audience === "emails") {
    const email = user.email.toLowerCase();
    return (d.emails ?? []).some((e) => e.toLowerCase() === email);
  }

  if (d.audience === "new-users") {
    const count = await Order.countDocuments({ user: user.id, status: "completed" });
    return count === 0;
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
  excludeOrderId?: string
): Promise<boolean> {
  const idFilter =
    excludeOrderId && /^[a-f\d]{24}$/i.test(excludeOrderId)
      ? { _id: { $ne: excludeOrderId } }
      : {};
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
  requireCode = false
): Promise<Candidate | null> {
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
  const candidates: Candidate[] = [];

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
    const candidate = await toCandidate(d, user, product, now, input.excludeOrderId);
    if (candidate) candidates.push(candidate);
  }

  const code = String(input.code ?? "").trim().toUpperCase();
  if (code) {
    const doc = rules.find((d) => (d.code ?? "").toUpperCase() === code);
    if (!doc) throw new DiscountError("This promo code isn't valid.");
    if (typeof doc.minSubtotal === "number" && doc.minSubtotal > 0 && amount < doc.minSubtotal) {
      throw new DiscountError("This promo code requires a higher order subtotal.");
    }
    const candidate = await toCandidate(doc, user, product, now, input.excludeOrderId, true);
    if (!candidate) throw new DiscountError("This promo code can't be applied to your order.");
    candidates.push(candidate);
  }

  const subtotal = roundMoney(amount);
  let best: { candidate: Candidate; savings: number } | null = null;
  for (const candidate of candidates) {
    const savings = savingsFor(candidate, subtotal, currency);
    if (savings === null || savings <= 0) continue;
    if (!best || savings > best.savings || (savings === best.savings && candidate.code)) {
      best = { candidate, savings };
    }
  }

  const discount = best ? roundMoney(Math.min(best.savings, subtotal)) : 0;
  return {
    subtotal,
    discount,
    total: roundMoney(subtotal - discount),
    discountId: best?.candidate.id,
    code: best?.candidate.code,
    label: best?.candidate.label,
  };
}
