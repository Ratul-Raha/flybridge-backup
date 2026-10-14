import "server-only";

import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AffiliateClick } from "@/lib/models/affiliate-click";
import { AffiliateConversion } from "@/lib/models/affiliate-conversion";

export type AffiliateTotals = {
  conversions: number;
  pending: number;
  approved: number;
  paid: number;
  reversed: number;
  orderTotal: number;
};

function emptyTotals(): AffiliateTotals {
  return {
    conversions: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    reversed: 0,
    orderTotal: 0,
  };
}

/**
 * Balances per currency, derived from the ledger so they can never drift. The
 * amounts are the commission sums; `orderTotal` is the sales volume behind them.
 */
export async function computeAffiliateTotals(
  affiliateId: string
): Promise<Record<string, AffiliateTotals>> {
  await connectDb();
  const rows = await AffiliateConversion.aggregate<{
    _id: { currency: string; status: string };
    amount: number;
    count: number;
    orderTotal: number;
  }>([
    { $match: { affiliate: new Types.ObjectId(affiliateId) } },
    {
      $group: {
        _id: { currency: "$currency", status: "$status" },
        amount: { $sum: "$commissionAmount" },
        count: { $sum: 1 },
        orderTotal: { $sum: "$orderTotal" },
      },
    },
  ]);

  const out: Record<string, AffiliateTotals> = {};
  for (const row of rows) {
    const currency = (row._id.currency ?? "USD").toUpperCase();
    const totals = (out[currency] ??= emptyTotals());
    totals.conversions += row.count;
    totals.orderTotal += row.orderTotal;
    if (row._id.status === "pending") totals.pending += row.amount;
    else if (row._id.status === "approved") totals.approved += row.amount;
    else if (row._id.status === "paid") totals.paid += row.amount;
    else if (row._id.status === "reversed") totals.reversed += row.amount;
  }
  return out;
}

export async function countAffiliateClicks(affiliateId: string): Promise<number> {
  await connectDb();
  return AffiliateClick.countDocuments({ affiliate: affiliateId });
}
