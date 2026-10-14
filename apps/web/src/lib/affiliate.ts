import "server-only";

import { randomUUID } from "crypto";
import { connectDb } from "@/lib/db";
import { Affiliate, AFFILIATE_PAYOUT_METHODS, type AffiliatePayoutMethod } from "@/lib/models/affiliate";

export const AFFILIATE_COOKIE = "flybridge_affiliate";
/** Last-click attribution window, matching the shared marketing cookie. */
export const AFFILIATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
/** Days a commission stays pending before it can be paid out. */
export const AFFILIATE_HOLD_DAYS = 3;

export type AffiliateRef = {
  affiliateId: string;
  code: string;
  clickId?: string;
  ts?: string;
};

export function normalizeAffiliateCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export type AffiliateSession = {
  userId?: string | null;
  email?: string | null;
};

/**
 * Resolves the affiliate a signed-in user belongs to, matching either their
 * linked account or their email. An affiliate can be external with no login, so
 * the email match is what lets a partner sign in with the address on file.
 */
export async function findAffiliateForSession(session: AffiliateSession) {
  await connectDb();
  const or: Record<string, unknown>[] = [];
  if (session.userId) or.push({ user: session.userId });
  const email = session.email?.trim().toLowerCase();
  if (email) or.push({ email });
  if (or.length === 0) return null;
  return Affiliate.findOne({ $or: or });
}

export function newAffiliateClickId(): string {
  return randomUUID();
}

/**
 * The visitor cookie is a small JSON blob, URL-encoded. Parsing tolerates the
 * raw and decoded forms so a re-decoded cookie still reads back.
 */
export function parseAffiliateCookie(value: string | undefined): AffiliateRef | undefined {
  if (!value) return undefined;
  const candidates = [value];
  try {
    candidates.push(decodeURIComponent(value));
  } catch {
    // Keep the raw value; malformed encoding must not break checkout.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      const affiliateId = typeof parsed.affiliateId === "string" ? parsed.affiliateId : "";
      const code = normalizeAffiliateCode(parsed.code);
      if (!affiliateId || !code) continue;
      return {
        affiliateId,
        code,
        clickId: typeof parsed.clickId === "string" ? parsed.clickId : undefined,
        ts: typeof parsed.ts === "string" ? parsed.ts : undefined,
      };
    } catch {
      // Try the next candidate.
    }
  }
  return undefined;
}

export function encodeAffiliateCookie(ref: AffiliateRef): string {
  return encodeURIComponent(
    JSON.stringify({
      affiliateId: ref.affiliateId,
      code: ref.code,
      clickId: ref.clickId,
      ts: ref.ts ?? new Date().toISOString(),
    })
  );
}

export function affiliateLink(origin: string, code: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/r/${normalizeAffiliateCode(code)}`;
}

export type AffiliatePayoutDetails = {
  method: AffiliatePayoutMethod;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  routingNumber: string;
  note: string;
};

export function parsePayoutDetails(value: unknown): AffiliatePayoutDetails {
  const input = (value ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max = 200) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const method = AFFILIATE_PAYOUT_METHODS.includes(input.method as AffiliatePayoutMethod)
    ? (input.method as AffiliatePayoutMethod)
    : "bKash";
  return {
    method,
    accountName: str(input.accountName),
    accountNumber: str(input.accountNumber),
    bankName: str(input.bankName),
    branchName: str(input.branchName),
    routingNumber: str(input.routingNumber),
    note: str(input.note, 500),
  };
}

function codeSeed(seed: string): string {
  const cleaned = seed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
  return cleaned || "PARTNER";
}

/**
 * Builds a unique, human-readable code from a name or email. Tries the bare
 * seed first, then appends a short numeric suffix until it is free.
 */
export async function generateAffiliateCode(seed: string): Promise<string> {
  await connectDb();
  const base = codeSeed(seed);
  const candidates = [base];
  for (let i = 1; i <= 25; i += 1) {
    candidates.push(`${base}${i}`);
  }
  for (const candidate of candidates) {
    if (!(await Affiliate.exists({ code: candidate }))) return candidate;
  }
  // Fall back to a random suffix if the seed space is saturated.
  let candidate = base;
  do {
    candidate = `${base}${Math.floor(Math.random() * 100000)}`;
  } while (await Affiliate.exists({ code: candidate }));
  return candidate;
}

export type SerializedAffiliate = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  code: string;
  status: string;
  commissionPercent: number;
  currency: string;
  payoutMethod: string;
  payoutDetails: {
    method: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
    routingNumber: string;
    note: string;
  };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeAffiliate(doc: Record<string, unknown>): SerializedAffiliate {
  const details = (doc.payoutDetails ?? {}) as Record<string, unknown>;
  const str = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    id: String((doc._id as { toString(): string }).toString()),
    userId: doc.user ? String(doc.user) : null,
    name: str(doc.name),
    email: str(doc.email),
    phone: str(doc.phone),
    code: str(doc.code),
    status: str(doc.status) || "active",
    commissionPercent:
      typeof doc.commissionPercent === "number" ? doc.commissionPercent : 0,
    currency: str(doc.currency) || "BDT",
    payoutMethod: str(doc.payoutMethod) || "bKash",
    payoutDetails: {
      method: str(details.method) || str(doc.payoutMethod) || "bKash",
      accountName: str(details.accountName),
      accountNumber: str(details.accountNumber),
      bankName: str(details.bankName),
      branchName: str(details.branchName),
      routingNumber: str(details.routingNumber),
      note: str(details.note),
    },
    notes: str(doc.notes),
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}
