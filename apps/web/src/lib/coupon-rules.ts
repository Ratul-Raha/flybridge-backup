import type { OrderItemType } from "./models/order";

export const COUPON_TYPES = ["percent", "fixed"] as const;
export const COUPON_APPLIES_TO = ["all", "course", "seminar", "resource", "mock-bundle"] as const;

export type CouponType = (typeof COUPON_TYPES)[number];
export type CouponAppliesTo = (typeof COUPON_APPLIES_TO)[number];

export type CouponInput = {
  name: string;
  description: string;
  code: string;
  type: CouponType;
  value: number;
  currency: "USD" | "BDT";
  appliesTo: CouponAppliesTo;
  minSubtotal: number;
  maxRedemptions: number | null;
  maxUsesPerUser: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
};

export type CouponRule = Pick<
  CouponInput,
  | "code"
  | "type"
  | "value"
  | "currency"
  | "appliesTo"
  | "minSubtotal"
  | "maxRedemptions"
  | "maxUsesPerUser"
  | "startsAt"
  | "endsAt"
  | "active"
>;

export function normalizeCouponCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asDate(value: unknown): Date | null | "invalid" {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "invalid";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
}

function parseOptionalLimit(value: unknown, label: string): number | null | string {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return `${label} must be a positive whole number or left blank`;
  }
  return parsed;
}

export function parseCouponInput(body: unknown): CouponInput | { error: string } {
  const input = (body ?? {}) as Record<string, unknown>;
  const name = asString(input.name);
  if (!name) return { error: "Name is required" };

  const code = normalizeCouponCode(input.code);
  if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) {
    return { error: "Code must be 2–40 letters, numbers, hyphens or underscores" };
  }

  const type = asString(input.type) as CouponType;
  if (!(COUPON_TYPES as readonly string[]).includes(type)) {
    return { error: "Type must be percent or fixed" };
  }

  const value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { error: "Value must be greater than zero" };
  }
  if (type === "percent" && value > 100) {
    return { error: "Percent coupons cannot exceed 100%" };
  }

  const appliesTo = (asString(input.appliesTo) || "all") as CouponAppliesTo;
  if (!(COUPON_APPLIES_TO as readonly string[]).includes(appliesTo)) {
    return { error: "Choose a valid item type" };
  }

  const currency = (asString(input.currency) || "BDT").toUpperCase();
  if (currency !== "BDT" && currency !== "USD") {
    return { error: "Currency must be BDT or USD" };
  }

  const startsAt = asDate(input.startsAt);
  const endsAt = asDate(input.endsAt);
  if (startsAt === "invalid" || endsAt === "invalid") {
    return { error: "Enter valid start and end dates" };
  }
  if (startsAt && endsAt && startsAt.getTime() > endsAt.getTime()) {
    return { error: "Start date must be before the end date" };
  }

  const minSubtotal = input.minSubtotal == null || input.minSubtotal === "" ? 0 : Number(input.minSubtotal);
  if (!Number.isFinite(minSubtotal) || minSubtotal < 0) {
    return { error: "Minimum subtotal must be zero or greater" };
  }

  const maxRedemptions = parseOptionalLimit(input.maxRedemptions, "Redemption limit");
  if (typeof maxRedemptions === "string") return { error: maxRedemptions };

  const maxUsesPerUser =
    input.maxUsesPerUser == null || input.maxUsesPerUser === ""
      ? 1
      : Number(input.maxUsesPerUser);
  if (!Number.isSafeInteger(maxUsesPerUser) || maxUsesPerUser < 0) {
    return { error: "Uses per customer must be zero (unlimited) or a positive whole number" };
  }

  return {
    name,
    description: asString(input.description),
    code,
    type,
    value,
    currency: currency as "USD" | "BDT",
    appliesTo,
    minSubtotal,
    maxRedemptions,
    maxUsesPerUser,
    startsAt,
    endsAt,
    active: input.active !== false,
  };
}

export function couponEligibilityError(
  coupon: CouponRule,
  context: {
    itemType: OrderItemType;
    currency: string;
    eligibleSubtotal: number;
    redemptions: number;
    userRedemptions: number;
    now?: Date;
  }
): string | null {
  if (!coupon.active) return "This coupon is inactive.";

  const now = context.now ?? new Date();
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    return "This coupon is not active yet.";
  }
  if (coupon.endsAt && coupon.endsAt.getTime() < now.getTime()) {
    return "This coupon has expired.";
  }
  if (coupon.appliesTo !== "all" && coupon.appliesTo !== context.itemType) {
    return "This coupon does not apply to this item.";
  }
  if (!Number.isFinite(context.eligibleSubtotal) || context.eligibleSubtotal <= 0) {
    return "This coupon cannot be applied to this order.";
  }
  if (coupon.type === "fixed" && coupon.currency !== context.currency.toUpperCase()) {
    return `This coupon is valid only for ${coupon.currency}.`;
  }
  if (coupon.minSubtotal > 0 && coupon.currency !== context.currency.toUpperCase()) {
    return `This coupon's minimum subtotal is in ${coupon.currency}.`;
  }
  if (coupon.minSubtotal > context.eligibleSubtotal) {
    return `This coupon requires a minimum subtotal of ${coupon.minSubtotal} ${context.currency.toUpperCase()}.`;
  }
  if (coupon.maxRedemptions !== null && context.redemptions >= coupon.maxRedemptions) {
    return "This coupon has reached its redemption limit.";
  }
  if (coupon.maxUsesPerUser > 0 && context.userRedemptions >= coupon.maxUsesPerUser) {
    return "You have already used this coupon the maximum number of times.";
  }
  return null;
}

export function calculateCouponDiscount(
  coupon: Pick<CouponRule, "type" | "value" | "currency">,
  amount: number,
  currency: string
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const subtotal = Math.round(amount * 100) / 100;
  const raw =
    coupon.type === "percent"
      ? (subtotal * coupon.value) / 100
      : coupon.currency === currency.toUpperCase()
        ? coupon.value
        : 0;
  return Math.min(subtotal, Math.round(raw * 100) / 100);
}
