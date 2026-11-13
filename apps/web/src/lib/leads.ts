import "server-only";

import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { Lead, LEAD_PRIORITIES, LEAD_SOURCES, type LeadDoc, type LeadPriority, type LeadSource } from "@/lib/models/lead";
import { LeadList } from "@/lib/models/lead-list";
import { Order } from "@/lib/models/order";
import { CourseWishlist } from "@/lib/models/wishlist";
import { SeminarRegistration } from "@/lib/models/seminar";
import { User } from "@/lib/models/user";

export type LeadInterestInput = {
  itemType: string;
  itemId: string;
  title?: string | null;
};

export type LeadSignal = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  source?: LeadSource;
  attribution?: Record<string, unknown> | null;
  interest?: LeadInterestInput | null;
  priority?: LeadPriority | null;
  customFields?: Record<string, unknown> | null;
  /** The list the lead should belong to. Falls back to the default list. */
  listId?: string | null;
};

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function toObjectId(value: string | null | undefined): Types.ObjectId | null {
  return value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

/**
 * Resolves the list a new lead should land in: an explicit list when given,
 * otherwise the default list. Creates a "General" default list on first use so
 * every lead always has a home.
 */
export async function resolveLeadList(listId?: string | null): Promise<Types.ObjectId | null> {
  if (listId && Types.ObjectId.isValid(listId)) {
    const list = await LeadList.findById(listId).select("_id").lean();
    if (list) return list._id;
  }
  await connectDb();
  const existing = await LeadList.findOneAndUpdate(
    { isDefault: true },
    { $setOnInsert: { name: "General", isDefault: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return existing._id;
}

export function isLeadSource(value: unknown): value is LeadSource {
  return typeof value === "string" && (LEAD_SOURCES as readonly string[]).includes(value);
}

/** Whitelists primitive custom-field values coming from an untrusted payload. */
export function sanitizeCustomFields(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.trim().slice(0, 60);
    if (!key) continue;
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[key] = typeof v === "string" ? v.slice(0, 2000) : v;
    }
  }
  return out;
}

/**
 * Creates or updates a lead from a business signal (waitlist, seminar
 * registration, inquiry, checkout, signup). A lead is anchored to an email or a
 * user account; the first signal creates it, later signals enrich it without
 * duplicating the contact.
 */
export async function upsertLeadFromSignal(signal: LeadSignal): Promise<void> {
  const email = normalizeEmail(signal.email);
  const userId = toObjectId(signal.userId);

  if (!email && !userId) return;

  await connectDb();

  const match: Record<string, unknown>[] = [];
  if (email) match.push({ email });
  if (userId) match.push({ user: userId });

  const existing = await Lead.findOne({ $or: match });

  if (!existing) {
    if (!email) return;
    const interest = signal.interest?.itemId
      ? { ...signal.interest, createdAt: new Date() }
      : null;
    const list = await resolveLeadList(signal.listId);
    const priority = signal.priority && (LEAD_PRIORITIES as readonly string[]).includes(signal.priority)
      ? signal.priority
      : "medium";
    await Lead.create({
      user: userId,
      list,
      name: signal.name?.trim() || email.split("@")[0] || "Lead",
      email,
      phone: signal.phone?.trim() || undefined,
      status: "new",
      source: signal.source ?? "manual",
      priority,
      customFields: sanitizeCustomFields(signal.customFields),
      attribution: signal.attribution ?? undefined,
      interests: interest ? [interest] : [],
      lastActivityAt: new Date(),
    });
    return;
  }

  const set: Record<string, unknown> = {};
  const push: Record<string, unknown> = {};

  if (userId && !existing.user) set.user = userId;
  if (signal.name?.trim() && !existing.name) set.name = signal.name.trim();
  if (signal.phone?.trim() && !existing.phone) set.phone = signal.phone.trim();
  if (!existing.attribution && signal.attribution) set.attribution = signal.attribution;
  if (signal.priority && (LEAD_PRIORITIES as readonly string[]).includes(signal.priority)) set.priority = signal.priority;
  if (signal.customFields) {
    set.customFields = {
      ...(existing.customFields as Record<string, unknown> | null | undefined),
      ...sanitizeCustomFields(signal.customFields),
    };
  }
  if (!existing.list) {
    const list = await resolveLeadList(signal.listId);
    if (list) set.list = list;
  }
  set.lastActivityAt = new Date();

  if (signal.interest?.itemId) {
    const already = (existing.interests ?? []).some(
      (i) => i.itemId === signal.interest?.itemId && i.itemType === signal.interest?.itemType
    );
    if (!already) {
      push.interests = { ...signal.interest, createdAt: new Date() };
    }
  }

  const op: Record<string, unknown> = {};
  if (Object.keys(set).length) op.$set = set;
  if (Object.keys(push).length) op.$push = push;
  if (Object.keys(op).length) await Lead.updateOne({ _id: existing._id }, op);
}

type LeadRecord = LeadDoc & { _id: { toString(): string }; createdAt: Date; updatedAt: Date };

export function serializeLead(doc: LeadRecord) {
  const attr = doc.attribution as
    | {
        firstTouch?: { source?: string; medium?: string; campaign?: string } | null;
        lastTouch?: { source?: string; medium?: string; campaign?: string } | null;
      }
    | undefined
    | null;
  return {
    id: doc._id.toString(),
    user: doc.user ? String(doc.user) : null,
    list: doc.list ? String(doc.list) : null,
    name: doc.name,
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    status: doc.status,
    source: doc.source,
    priority: doc.priority ?? "medium",
    customFields: (doc.customFields as Record<string, unknown> | null | undefined) ?? {},
    owner: doc.owner ? String(doc.owner) : null,
    interests: (doc.interests ?? []).map((i) => ({
      itemType: i.itemType ?? "",
      itemId: i.itemId ?? "",
      title: i.title ?? "",
      createdAt: i.createdAt ?? null,
    })),
    tags: doc.tags ?? [],
    followUpAt: doc.followUpAt ?? null,
    lastContactedAt: doc.lastContactedAt ?? null,
    lastActivityAt: doc.lastActivityAt ?? null,
    convertedAt: doc.convertedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    attribution: attr
      ? {
          source: attr.lastTouch?.source ?? attr.firstTouch?.source ?? "",
          medium: attr.lastTouch?.medium ?? attr.firstTouch?.medium ?? "",
          campaign: attr.lastTouch?.campaign ?? attr.firstTouch?.campaign ?? "",
        }
      : null,
  };
}

export type LeadDetail = {
  lead: ReturnType<typeof serializeLead>;
  ownerName: string | null;
  orders: {
    id: string;
    total: number;
    currency: string;
    status: string;
    title: string;
    createdAt: Date | null;
  }[];
  wishlists: { id: string; title: string; source: string; createdAt: Date | null }[];
  registrations: { id: string; title: string; createdAt: Date | null }[];
  timeline: {
    id: string;
    kind: "note" | "order" | "waitlist" | "seminar" | "created";
    label: string;
    detail: string;
    at: Date | null;
  }[];
};

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  await connectDb();
  const lead = await Lead.findById(id).lean();
  if (!lead) return null;

  const email = (lead.email ?? "").trim().toLowerCase();
  const userId = lead.user ? String(lead.user) : null;

  const ownerDoc = lead.owner ? await User.findById(lead.owner).select("name").lean() : null;

  const orderMatch: Record<string, unknown> = {
    status: { $in: ["completed", "refunded"] },
  };
  const or: Record<string, unknown>[] = [];
  if (userId) or.push({ user: toObjectId(userId) });
  if (email) or.push({ email });
  const hasKey = or.length > 0;
  if (hasKey) orderMatch.$or = or;

  const [orders, wishlists, registrations] = await Promise.all([
    hasKey ? Order.find(orderMatch).sort({ createdAt: -1 }).limit(100).lean() : Promise.resolve([]),
    hasKey
      ? CourseWishlist.find(userId ? { user: toObjectId(userId) } : { email })
          .sort({ createdAt: -1 })
          .limit(100)
          .populate("course", "title")
          .lean()
      : Promise.resolve([]),
    email
      ? SeminarRegistration.find({ email })
          .sort({ createdAt: -1 })
          .limit(100)
          .populate("seminar", "title")
          .lean()
      : Promise.resolve([]),
  ]);

  const timeline: LeadDetail["timeline"] = [];

  timeline.push({
    id: `created-${lead._id.toString()}`,
    kind: "created",
    label: "Lead created",
    detail: `via ${lead.source}`,
    at: lead.createdAt ?? null,
  });

  for (const note of lead.notes ?? []) {
    const n = note as { _id: { toString(): string }; body: string; createdAt?: Date | null };
    timeline.push({
      id: `note-${n._id.toString()}`,
      kind: "note",
      label: "Note",
      detail: n.body,
      at: n.createdAt ?? null,
    });
  }

  for (const w of wishlists) {
    const doc = w as unknown as {
      _id: { toString(): string };
      source?: string;
      createdAt?: Date | null;
      course?: { title?: string } | null;
    };
    timeline.push({
      id: `waitlist-${doc._id.toString()}`,
      kind: "waitlist",
      label: "Joined waitlist",
      detail: doc.course?.title ?? "Course",
      at: doc.createdAt ?? null,
    });
  }

  for (const r of registrations) {
    const doc = r as unknown as {
      _id: { toString(): string };
      createdAt?: Date | null;
      seminar?: { title?: string } | null;
    };
    timeline.push({
      id: `seminar-${doc._id.toString()}`,
      kind: "seminar",
      label: "Registered for seminar",
      detail: doc.seminar?.title ?? "Seminar",
      at: doc.createdAt ?? null,
    });
  }

  for (const o of orders) {
    const doc = o as unknown as {
      _id: { toString(): string };
      total?: number;
      currency?: string;
      status?: string;
      items?: { title?: string }[];
      createdAt?: Date | null;
    };
    timeline.push({
      id: `order-${doc._id.toString()}`,
      kind: "order",
      label: "Order",
      detail: (doc.items?.[0]?.title ?? "Purchase") + (doc.currency ? ` · ${doc.currency}` : ""),
      at: doc.createdAt ?? null,
    });
  }

  timeline.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());

  return {
    lead: serializeLead(lead as unknown as LeadRecord),
    ownerName: ownerDoc?.name ?? null,
    orders: orders.map((o) => {
      const doc = o as unknown as {
        _id: { toString(): string };
        total?: number;
        currency?: string;
        status?: string;
        items?: { title?: string }[];
        createdAt?: Date | null;
      };
      return {
        id: doc._id.toString(),
        total: doc.total ?? 0,
        currency: doc.currency ?? "USD",
        status: doc.status ?? "completed",
        title: doc.items?.[0]?.title ?? "Purchase",
        createdAt: doc.createdAt ?? null,
      };
    }),
    wishlists: wishlists.map((w) => {
      const doc = w as unknown as {
        _id: { toString(): string };
        source?: string;
        createdAt?: Date | null;
        course?: { title?: string } | null;
      };
      return {
        id: doc._id.toString(),
        title: doc.course?.title ?? "Course",
        source: doc.source ?? "waitlist",
        createdAt: doc.createdAt ?? null,
      };
    }),
    registrations: registrations.map((r) => {
      const doc = r as unknown as {
        _id: { toString(): string };
        createdAt?: Date | null;
        seminar?: { title?: string } | null;
      };
      return {
        id: doc._id.toString(),
        title: doc.seminar?.title ?? "Seminar",
        createdAt: doc.createdAt ?? null,
      };
    }),
    timeline,
  };
}
