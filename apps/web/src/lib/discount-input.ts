import {
  DISCOUNT_APPLIES_TO,
  DISCOUNT_AUDIENCES,
  DISCOUNT_SCOPES,
  DISCOUNT_TYPES,
  type DiscountAppliesTo,
  type DiscountAudience,
  type DiscountDoc,
  type DiscountScope,
  type DiscountType,
} from "@/lib/models/discount";

export function serializeDiscount(d: DiscountDoc, redemptions = 0) {
  return {
    id: d._id.toString(),
    name: d.name,
    description: d.description ?? "",
    code: d.code ?? null,
    type: d.type,
    value: d.value,
    currency: d.currency ?? "USD",
    appliesTo: d.appliesTo ?? "course",
    scope: d.scope ?? "all",
    courseIds: (d.courseIds ?? []).map((id) => id.toString()),
    audience: d.audience ?? "everyone",
    emails: d.emails ?? [],
    startsAt: d.startsAt ?? null,
    endsAt: d.endsAt ?? null,
    minSubtotal: d.minSubtotal ?? 0,
    maxRedemptions: d.maxRedemptions ?? null,
    maxUsesPerUser: d.maxUsesPerUser ?? 0,
    active: d.active ?? true,
    redemptions,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export type DiscountInput = {
  name: string;
  description: string;
  code?: string;
  type: DiscountType;
  value: number;
  currency: string;
  appliesTo: DiscountAppliesTo;
  scope: DiscountScope;
  courseIds: string[];
  audience: DiscountAudience;
  emails: string[];
  startsAt: Date | null;
  endsAt: Date | null;
  minSubtotal: number;
  maxRedemptions: number | null;
  maxUsesPerUser: number;
  active: boolean;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => asString(v)).filter(Boolean);
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseDiscountInput(body: unknown): DiscountInput | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = asString(b.name);
  if (!name) return { error: "Name is required" };

  const type = asString(b.type) as DiscountType;
  if (!(DISCOUNT_TYPES as readonly string[]).includes(type)) {
    return { error: "Type must be percent or fixed" };
  }

  const value = Number(b.value);
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Value must be a non-negative number" };
  }
  if (type === "percent" && value > 100) {
    return { error: "Percent discounts cannot exceed 100" };
  }

  const appliesTo = (asString(b.appliesTo) || "course") as DiscountAppliesTo;
  if (!(DISCOUNT_APPLIES_TO as readonly string[]).includes(appliesTo)) {
    return { error: "Invalid applies-to target" };
  }

  const scope = (asString(b.scope) || "all") as DiscountScope;
  if (!(DISCOUNT_SCOPES as readonly string[]).includes(scope)) {
    return { error: "Invalid scope" };
  }

  const audience = (asString(b.audience) || "everyone") as DiscountAudience;
  if (!(DISCOUNT_AUDIENCES as readonly string[]).includes(audience)) {
    return { error: "Invalid audience" };
  }

  const code = asString(b.code).toUpperCase();

  const startsAt = asDate(b.startsAt);
  const endsAt = asDate(b.endsAt);
  if (startsAt && endsAt && startsAt.getTime() > endsAt.getTime()) {
    return { error: "Start date must be before the end date" };
  }

  const maxRedemptionsRaw = b.maxRedemptions;
  const maxRedemptions =
    maxRedemptionsRaw === null || maxRedemptionsRaw === "" || maxRedemptionsRaw === undefined
      ? null
      : Math.max(0, Math.floor(Number(maxRedemptionsRaw)));

  return {
    name,
    description: asString(b.description),
    code: code || undefined,
    type,
    value,
    currency: (asString(b.currency) || "USD").toUpperCase(),
    appliesTo,
    scope,
    courseIds:
      appliesTo === "course" || appliesTo === "all" ? asStringArray(b.courseIds) : [],
    audience,
    emails: audience === "emails" ? asStringArray(b.emails).map((e) => e.toLowerCase()) : [],
    startsAt,
    endsAt,
    minSubtotal: Math.max(0, Number(b.minSubtotal) || 0),
    maxRedemptions: maxRedemptions !== null && Number.isFinite(maxRedemptions) ? maxRedemptions : null,
    maxUsesPerUser: Math.max(0, Math.floor(Number(b.maxUsesPerUser) || 0)),
    active: b.active !== false,
  };
}
