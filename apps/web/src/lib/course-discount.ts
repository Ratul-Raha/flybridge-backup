/**
 * The one place a course's discount is turned into a price.
 *
 * A discount belongs to the course, so it has no audience and no usage cap:
 * everyone who can see the course sees the same price, whether they are
 * signed in, signed out, or already enrolled (enrollment is gated separately).
 * Whether it is running is decided only by the active flag and the dates.
 */

import { cleanPrices, formatMoney, type CurrencyPrices, type StoredPrices } from "./pricing.ts";

export type CourseDiscount = {
  active?: boolean | null;
  name?: string | null;
  price?: number | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

/** The shape sent to the browser: dates become strings so it stays JSON-safe. */
export type SerializedCourseDiscount = {
  active: boolean;
  name: string;
  price: number;
  startsAt: string | null;
  endsAt: string | null;
};

export type PublicCoursePricing = {
  /** Prices with the running discount already applied. */
  prices: CurrencyPrices;
  /** What a buyer pays now, or null when the course has no BDT price. */
  price: number | null;
  /** Formatted original price for the strikethrough, or null when there is none. */
  originalPrice: string | null;
  /** The name to show on the offer, or null when the discount is not running. */
  discountLabel: string | null;
  /** How much the discount takes off, as a number for copy. Zero when not running. */
  savings: number;
  /**
   * Whether this course's discount has ever been set up. Surfaces use it to tell
   * "the admin turned the discount off" (show one plain price) apart from "this
   * course has never had one" (marketing copy may still show a strikethrough).
   */
  configured: boolean;
  /** When the running deal stops, as an ISO string, or null if it never does. */
  endsAt: string | null;
  /** When the running deal started, as an ISO string, or null if it always has. */
  startsAt: string | null;
  discounted: boolean;
};

export type CoursePrice = {
  /** What a buyer pays right now. */
  price: number;
  /** The full price the discount is measured against, or null when there is none. */
  originalPrice: number | null;
  /** How much the discount takes off. Zero when it is not running. */
  savings: number;
  /** The name to show on the offer, when one was given. */
  label: string | null;
};

function isoOrNull(value: Date | string | number | null | undefined): string | null {
  const time = typeof value === "number" ? value : toTime(value);
  return time === null ? null : new Date(time).toISOString();
}

/** Whether anyone has ever set this discount up, even if it is switched off now. */
function isConfigured(discount: CourseDiscount | null | undefined): boolean {
  if (!discount) return false;
  return (
    discount.active === true ||
    Boolean(discount.name?.trim()) ||
    Number(discount.price) > 0 ||
    toTime(discount.startsAt) !== null ||
    toTime(discount.endsAt) !== null
  );
}

function toTime(value: Date | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * A discount is only usable if it is switched on, has a real price, and today
 * falls inside its window. An end date in the past retires it on its own; no
 * end date means it runs until someone switches it off.
 */
export function isDiscountLive(
  discount: CourseDiscount | null | undefined,
  now: Date = new Date()
): boolean {
  if (!discount?.active) return false;
  const price = Number(discount.price);
  if (!Number.isFinite(price) || price <= 0) return false;

  const current = now.getTime();
  const startsAt = toTime(discount.startsAt);
  if (startsAt !== null && current < startsAt) return false;
  const endsAt = toTime(discount.endsAt);
  if (endsAt !== null && current > endsAt) return false;

  return true;
}

/**
 * Resolves the price of a course against its own discount. `originalPrice` is
 * the course's normal price; when the discount is not running it is returned
 * unchanged with no original, so callers show one price and no strikethrough.
 *
 * A discount price at or above the original is ignored rather than shown as a
 * "discount", so a mistyped number can never charge more than the full price.
 */
export function resolveCoursePrice(
  originalPrice: number | null | undefined,
  discount: CourseDiscount | null | undefined,
  now: Date = new Date()
): CoursePrice {
  const original =
    typeof originalPrice === "number" && Number.isFinite(originalPrice)
      ? originalPrice
      : null;

  if (original === null || !isDiscountLive(discount, now)) {
    return {
      price: original ?? 0,
      originalPrice: null,
      savings: 0,
      label: null,
    };
  }

  const price = Number(discount!.price);
  if (price >= original) {
    return { price: original, originalPrice: null, savings: 0, label: null };
  }

  const name = discount!.name?.trim();
  return {
    price,
    originalPrice: original,
    savings: Math.round((original - price) * 100) / 100,
    label: name ? name : null,
  };
}

/**
 * Reads the discount block the course editor sends. A missing or malformed
 * field leaves the discount off rather than guessing, so a broken save can
 * never switch on a discount at some unintended price.
 */
export function parseCourseDiscount(input: unknown): {
  active: boolean;
  name: string;
  price: number;
  startsAt: Date | null;
  endsAt: Date | null;
} {
  const d = (input ?? {}) as Record<string, unknown>;
  const date = (value: unknown): Date | null => {
    if (typeof value !== "string" || !value.trim()) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  return {
    active: d.active === true,
    name: typeof d.name === "string" ? d.name.trim() : "",
    price: Math.max(0, Number(d.price) || 0),
    startsAt: date(d.startsAt),
    endsAt: date(d.endsAt),
  };
}

export function serializeCourseDiscount(
  discount: CourseDiscount | null | undefined
): SerializedCourseDiscount {
  const startsAt = toTime(discount?.startsAt);
  const endsAt = toTime(discount?.endsAt);
  return {
    active: discount?.active ?? false,
    name: discount?.name?.trim() ?? "",
    price: Number(discount?.price) || 0,
    startsAt: isoOrNull(startsAt),
    endsAt: isoOrNull(endsAt),
  };
}

/**
 * What every public surface (home, listings, nav menu, landing pages) shows:
 * the discounted BDT price plus the original to strike through. All of them go
 * through here so they cannot drift apart.
 */
export function publicCoursePricing(
  course: {
    prices?: StoredPrices | CurrencyPrices | null;
    discount?: CourseDiscount | null;
  },
  now: Date = new Date()
): PublicCoursePricing {
  const prices = cleanPrices(course.prices);
  const base = prices.BDT;
  const configured = isConfigured(course.discount);
  const resolved =
    typeof base === "number" && base > 0
      ? resolveCoursePrice(base, course.discount, now)
      : null;

  // `originalPrice` is set exactly when a discount is running, whether or not
  // it was given a name to display.
  if (!resolved || resolved.originalPrice === null) {
    return {
      prices: resolved ? { ...prices, BDT: resolved.price } : prices,
      price: resolved ? resolved.price : null,
      originalPrice: null,
      discountLabel: null,
      savings: 0,
      configured,
      endsAt: null,
      startsAt: null,
      discounted: false,
    };
  }

  return {
    prices: { ...prices, BDT: resolved.price },
    price: resolved.price,
    originalPrice: formatMoney(resolved.originalPrice, "BDT"),
    discountLabel: resolved.label,
    savings: resolved.savings,
    configured,
    endsAt: isoOrNull(course.discount?.endsAt),
    startsAt: isoOrNull(course.discount?.startsAt),
    discounted: true,
  };
}
