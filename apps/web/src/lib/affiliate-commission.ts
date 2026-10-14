import "server-only";

import { connectDb } from "@/lib/db";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";
import { Order, type OrderDoc } from "@/lib/models/order";
import { emitEvent } from "@/lib/events/emit";
import { AFFILIATE_HOLD_DAYS } from "@/lib/affiliate";
import { roundMoney } from "@/lib/wishlist";

export type ResolvedCommission = {
  percent: number;
  amount: number;
};

/**
 * Works out what an order earns an affiliate, or null when it earns nothing:
 * free orders, self-referrals, and inactive affiliates are all excluded.
 */
export function resolveCommission(
  order: Pick<OrderDoc, "total" | "email" | "user">,
  affiliate: { commissionPercent?: number | null; email?: string | null; user?: unknown }
): ResolvedCommission | null {
  if (!order.total || order.total <= 0) return null;

  const affiliateUserId = affiliate.user ? String(affiliate.user) : "";
  const orderUserId = order.user ? String(order.user) : "";
  if (affiliateUserId && orderUserId && affiliateUserId === orderUserId) return null;

  const affiliateEmail = (affiliate.email ?? "").trim().toLowerCase();
  const orderEmail = (order.email ?? "").trim().toLowerCase();
  if (affiliateEmail && orderEmail && affiliateEmail === orderEmail) return null;

  const percent =
    typeof affiliate.commissionPercent === "number" ? affiliate.commissionPercent : 0;
  if (percent <= 0) return null;

  const amount = roundMoney((order.total * percent) / 100);
  if (amount <= 0) return null;

  return { percent, amount };
}

/**
 * Records the commission for an order that has an affiliate attached. Safe to
 * call more than once — the unique index on `order` makes a repeat a no-op.
 */
export async function recordAffiliateConversion(orderId: string): Promise<void> {
  await connectDb();

  const order = await Order.findById(orderId).lean();
  if (!order) return;
  if (order.status !== "completed") return;

  const affiliateId = order.affiliate?.affiliateId;
  if (!affiliateId) return;

  const affiliate = await Affiliate.findById(affiliateId).lean();
  if (!affiliate || affiliate.status !== "active") return;

  const resolved = resolveCommission(order, affiliate);
  if (!resolved) return;

  const completedAt = order.completedAt ?? new Date();
  const availableAt = new Date(completedAt.getTime() + AFFILIATE_HOLD_DAYS * 24 * 60 * 60 * 1000);
  const item = order.items?.[0];

  let conversion;
  try {
    conversion = await AffiliateConversion.create({
      affiliate: affiliate._id,
      order: order._id,
      user: order.user ?? null,
      itemType: item?.itemType ?? null,
      itemId: item?.itemId ?? null,
      itemTitle: item?.title ?? null,
      orderTotal: order.total,
      currency: order.currency ?? "USD",
      commissionPercent: resolved.percent,
      commissionAmount: resolved.amount,
      status: "pending",
      availableAt,
      clickId: order.affiliate?.clickId ?? null,
    });
  } catch (error) {
    // A duplicate means the commission was already recorded for this order.
    if ((error as { code?: number })?.code === 11000) return;
    throw error;
  }

  await emitEvent("affiliate.conversion", {
    affiliate: {
      id: affiliate._id.toString(),
      name: affiliate.name,
      code: affiliate.code,
      email: affiliate.email ?? null,
    },
    conversion: {
      id: conversion._id.toString(),
      orderId: order._id.toString(),
      amount: resolved.amount,
      currency: order.currency ?? "USD",
      orderTotal: order.total,
      itemTitle: item?.title ?? null,
    },
  });
}

/**
 * Reverses a live commission when its order is refunded. A commission that has
 * already been paid out is left alone — reclaiming that is a manual, financial
 * decision, so it is flagged rather than silently adjusted.
 */
export async function reverseAffiliateConversion(
  orderId: string,
  reason: string
): Promise<{ reversed: boolean; reason?: string }> {
  await connectDb();

  const conversion = await AffiliateConversion.findOne({ order: orderId });
  if (!conversion) return { reversed: false, reason: "no-conversion" };
  if (conversion.status === "reversed") return { reversed: false, reason: "already-reversed" };
  if (conversion.status === "paid") return { reversed: false, reason: "already-paid" };

  conversion.status = "reversed";
  conversion.reversedAt = new Date();
  conversion.reversedReason = reason.slice(0, 500);
  await conversion.save();
  return { reversed: true };
}

/**
 * Promotes pending commissions to approved once their hold window has passed,
 * so they become payable. Optionally scoped to one affiliate. Returns how many
 * were promoted.
 */
export async function approveDueConversions(affiliateId?: string): Promise<number> {
  await connectDb();
  const result = await AffiliateConversion.updateMany(
    {
      status: "pending",
      availableAt: { $lte: new Date() },
      ...(affiliateId ? { affiliate: affiliateId } : {}),
    },
    { $set: { status: "approved" } }
  );
  return result.modifiedCount ?? 0;
}
