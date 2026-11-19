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

export type AffiliateLinkCurrencyPerformance = {
  conversions: number;
  orderTotal: number;
  commission: number;
  pending: number;
  approved: number;
  paid: number;
  reversed: number;
};

export type AffiliateLinkPerformance = {
  affiliateId: string;
  destination: string;
  clicks: number;
  conversions: number;
  currencies: Record<string, AffiliateLinkCurrencyPerformance>;
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

/**
 * Groups visits and attributed orders by the destination URL used by each
 * affiliate link. Conversion rows are matched back to the originating click id.
 */
export async function computeAffiliateLinkPerformance(
  affiliateId?: string
): Promise<AffiliateLinkPerformance[]> {
  await connectDb();

  const affiliateMatch = affiliateId ? { affiliate: new Types.ObjectId(affiliateId) } : {};
  const [clickRows, conversionRows] = await Promise.all([
    AffiliateClick.aggregate<{
      _id: { affiliate: Types.ObjectId; destination: string };
      clicks: number;
    }>([
      { $match: affiliateMatch },
      {
        $group: {
          _id: {
            affiliate: "$affiliate",
            destination: { $ifNull: ["$destination", "/"] },
          },
          clicks: { $sum: 1 },
        },
      },
    ]),
    AffiliateConversion.aggregate<{
      _id: {
        affiliate: Types.ObjectId;
        destination: string;
        currency: string;
        status: string;
      };
      conversions: number;
      orderTotal: number;
      commission: number;
    }>([
      {
        $match: {
          ...affiliateMatch,
          clickId: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: {
            affiliate: "$affiliate",
            clickId: "$clickId",
            currency: "$currency",
            status: "$status",
          },
          conversions: { $sum: 1 },
          orderTotal: { $sum: "$orderTotal" },
          commission: { $sum: "$commissionAmount" },
        },
      },
      {
        $lookup: {
          from: AffiliateClick.collection.name,
          let: { affiliateId: "$_id.affiliate", clickId: "$_id.clickId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$affiliate", "$$affiliateId"] },
                    { $eq: ["$clickId", "$$clickId"] },
                  ],
                },
              },
            },
            { $project: { destination: 1 } },
            { $limit: 1 },
          ],
          as: "click",
        },
      },
      { $unwind: "$click" },
      {
        $group: {
          _id: {
            affiliate: "$_id.affiliate",
            destination: { $ifNull: ["$click.destination", "/"] },
            currency: "$_id.currency",
            status: "$_id.status",
          },
          conversions: { $sum: "$conversions" },
          orderTotal: { $sum: "$orderTotal" },
          commission: { $sum: "$commission" },
        },
      },
    ]),
  ]);

  const rows = new Map<string, AffiliateLinkPerformance>();
  const getRow = (id: Types.ObjectId, rawDestination: string | null | undefined) => {
    const affiliateKey = id.toString();
    const destination = rawDestination?.trim() || "/";
    const key = `${affiliateKey}:${destination}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        affiliateId: affiliateKey,
        destination,
        clicks: 0,
        conversions: 0,
        currencies: {},
      };
      rows.set(key, row);
    }
    return row;
  };

  for (const click of clickRows) {
    getRow(click._id.affiliate, click._id.destination).clicks = click.clicks;
  }

  for (const conversion of conversionRows) {
    const row = getRow(conversion._id.affiliate, conversion._id.destination);
    const currency = (conversion._id.currency || "USD").toUpperCase();
    const totals = (row.currencies[currency] ??= {
      conversions: 0,
      orderTotal: 0,
      commission: 0,
      pending: 0,
      approved: 0,
      paid: 0,
      reversed: 0,
    });
    totals.conversions += conversion.conversions;
    totals.orderTotal += conversion.orderTotal;
    if (conversion._id.status === "pending") totals.pending += conversion.commission;
    else if (conversion._id.status === "approved") totals.approved += conversion.commission;
    else if (conversion._id.status === "paid") totals.paid += conversion.commission;
    else if (conversion._id.status === "reversed") totals.reversed += conversion.commission;
    if (conversion._id.status !== "reversed") totals.commission += conversion.commission;
    row.conversions += conversion.conversions;
  }

  return [...rows.values()].sort(
    (a, b) => a.destination.localeCompare(b.destination) || a.affiliateId.localeCompare(b.affiliateId)
  );
}
