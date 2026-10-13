import "server-only";

import { connectDb } from "@/lib/db";
import { Order } from "@/lib/models/order";
import { CourseWishlist } from "@/lib/models/wishlist";
import { RefundRequest } from "@/lib/models/refund-request";
import { isMetaPurchaseEnabled } from "@/lib/meta-capi";
import {
  MARKETING_REPORT_TIME_ZONE,
  marketingDateKey,
  marketingPeriodWindow,
  type MarketingPeriod,
} from "@/lib/marketing-analytics-period";
import type {
  MarketingAnalyticsData,
  MarketingCouponRow,
  MarketingProductRow,
  MarketingSourceRow,
  MarketingTotals,
  MarketingTrendPoint,
} from "@/lib/marketing-analytics-types";
import type { SupportedCurrency } from "@/lib/pricing";

function currencies(currency: SupportedCurrency) {
  return { $in: [currency, currency.toLowerCase()] };
}

function orderDateExpression() {
  // completedAt is absent on historical orders, which fall back to updatedAt.
  return { $ifNull: ["$completedAt", "$updatedAt"] };
}

function completedOrderMatch(
  currency: SupportedCurrency,
  start: Date,
  end: Date
) {
  return {
    currency: currencies(currency),
    status: { $in: ["completed", "refunded"] },
    $or: [
      { completedAt: { $gte: start, $lt: end } },
      { completedAt: null, updatedAt: { $gte: start, $lt: end } },
    ],
  };
}

function number(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function summarize(
  currency: SupportedCurrency,
  range: { start: Date; end: Date }
): Promise<MarketingTotals> {
  const [salesRows, refundRows, leads] = await Promise.all([
    Order.aggregate([
      { $match: completedOrderMatch(currency, range.start, range.end) },
      {
        $group: {
          _id: null,
          paidOrders: { $sum: { $cond: [{ $gt: ["$total", 0] }, 1, 0] } },
          freeOrders: { $sum: { $cond: [{ $eq: ["$total", 0] }, 1, 0] } },
          grossRevenue: {
            $sum: { $cond: [{ $gt: ["$total", 0] }, "$total", 0] },
          },
        },
      },
    ]),
    RefundRequest.aggregate([
      {
        $match: {
          status: "refunded",
          currency: currencies(currency),
          refundedAt: { $gte: range.start, $lt: range.end },
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),
    CourseWishlist.countDocuments({
      createdAt: { $gte: range.start, $lt: range.end },
    }),
  ]);

  const sales = salesRows[0];
  const refund = refundRows[0];
  const paidOrders = number(sales?.paidOrders);
  const grossRevenue = number(sales?.grossRevenue);
  const refunds = number(refund?.amount);

  return {
    paidOrders,
    freeOrders: number(sales?.freeOrders),
    grossRevenue,
    refunds,
    refundedOrders: number(refund?.orders),
    netCash: grossRevenue - refunds,
    averageOrderValue: paidOrders > 0 ? grossRevenue / paidOrders : 0,
    leads,
  };
}

function touchSourceExpression() {
  return {
    $ifNull: [
      "$attribution.lastTouch.source",
      {
        $ifNull: [
          "$attribution.firstTouch.source",
          {
            $cond: [
              { $ne: [{ $ifNull: ["$attribution.fbc", ""] }, ""] },
              "meta",
              "Unattributed",
            ],
          },
        ],
      },
    ],
  };
}

function touchMediumExpression() {
  return {
    $ifNull: [
      "$attribution.lastTouch.medium",
      {
        $ifNull: [
          "$attribution.firstTouch.medium",
          {
            $cond: [
              { $ne: [{ $ifNull: ["$attribution.fbc", ""] }, ""] },
              "paid_social",
              "unknown",
            ],
          },
        ],
      },
    ],
  };
}

function touchCampaignExpression() {
  return {
    $ifNull: [
      "$attribution.lastTouch.campaign",
      { $ifNull: ["$attribution.firstTouch.campaign", ""] },
    ],
  };
}

function touchCampaignIdExpression() {
  return {
    $ifNull: [
      "$attribution.lastTouch.campaignId",
      { $ifNull: ["$attribution.firstTouch.campaignId", ""] },
    ],
  };
}

function sourceKey(row: { source: string; medium: string; campaign: string; campaignId: string }): string {
  return [row.source, row.medium, row.campaign, row.campaignId].join("\u0000");
}

async function sourceBreakdown(
  currency: SupportedCurrency,
  range: { start: Date; end: Date }
): Promise<MarketingSourceRow[]> {
  const [orderRows, leadRows] = await Promise.all([
    Order.aggregate([
      { $match: completedOrderMatch(currency, range.start, range.end) },
      {
        $group: {
          _id: {
            source: touchSourceExpression(),
            medium: touchMediumExpression(),
            campaign: touchCampaignExpression(),
            campaignId: touchCampaignIdExpression(),
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { revenue: -1, orders: -1 } },
      { $limit: 20 },
    ]),
    CourseWishlist.aggregate([
      { $match: { createdAt: { $gte: range.start, $lt: range.end } } },
      {
        $group: {
          _id: {
            source: {
              $ifNull: [
                "$attribution.lastTouch.source",
                { $ifNull: ["$attribution.firstTouch.source", "Unattributed"] },
              ],
            },
            medium: {
              $ifNull: [
                "$attribution.lastTouch.medium",
                { $ifNull: ["$attribution.firstTouch.medium", "unknown"] },
              ],
            },
            campaign: {
              $ifNull: [
                "$attribution.lastTouch.campaign",
                { $ifNull: ["$attribution.firstTouch.campaign", ""] },
              ],
            },
            campaignId: {
              $ifNull: [
                "$attribution.lastTouch.campaignId",
                { $ifNull: ["$attribution.firstTouch.campaignId", ""] },
              ],
            },
          },
          leads: { $sum: 1 },
        },
      },
    ]),
  ]);

  const rows = new Map<string, MarketingSourceRow>();
  for (const row of orderRows) {
    const source = String(row._id?.source || "Unattributed");
    const medium = String(row._id?.medium || "unknown");
    const campaign = String(row._id?.campaign || "—");
    const campaignId = String(row._id?.campaignId || "");
    const entry = { source, medium, campaign, campaignId, orders: number(row.orders), revenue: number(row.revenue), leads: 0 };
    rows.set(sourceKey(entry), entry);
  }
  for (const row of leadRows) {
    const source = String(row._id?.source || "Unattributed");
    const medium = String(row._id?.medium || "unknown");
    const campaign = String(row._id?.campaign || "—");
    const campaignId = String(row._id?.campaignId || "");
    const entry = rows.get(sourceKey({ source, medium, campaign, campaignId })) ?? {
      source,
      medium,
      campaign,
      campaignId,
      orders: 0,
      revenue: 0,
      leads: 0,
    };
    entry.leads = number(row.leads);
    rows.set(sourceKey(entry), entry);
  }

  return [...rows.values()].sort(
    (a, b) => b.revenue - a.revenue || b.orders - a.orders || b.leads - a.leads
  );
}

async function trend(
  currency: SupportedCurrency,
  range: { start: Date; end: Date }
): Promise<MarketingTrendPoint[]> {
  const date = orderDateExpression();
  const aggregates = await Order.aggregate([
    { $match: completedOrderMatch(currency, range.start, range.end) },
    { $match: { total: { $gt: 0 } } },
    {
      $group: {
        _id: {
          $dateToString: {
            date,
            format: "%Y-%m-%d",
            timezone: MARKETING_REPORT_TIME_ZONE,
          },
        },
        orders: { $sum: 1 },
        revenue: { $sum: "$total" },
      },
    },
  ]);

  const byDay = new Map<string, { orders: number; revenue: number }>(
    aggregates.map((row: { _id: string; orders: number; revenue: number }) => [
      row._id,
      { orders: number(row.orders), revenue: number(row.revenue) },
    ])
  );
  const points: MarketingTrendPoint[] = [];
  for (let day = new Date(range.start); day < range.end; day = new Date(day.getTime() + 24 * 60 * 60 * 1000)) {
    const dateKey = marketingDateKey(day);
    points.push({
      date: dateKey,
      label: new Intl.DateTimeFormat("en-US", {
        timeZone: MARKETING_REPORT_TIME_ZONE,
        month: "short",
        day: "numeric",
      }).format(day),
      orders: byDay.get(dateKey)?.orders ?? 0,
      revenue: byDay.get(dateKey)?.revenue ?? 0,
    });
  }
  return points;
}

async function products(
  currency: SupportedCurrency,
  range: { start: Date; end: Date }
): Promise<MarketingProductRow[]> {
  const rows = await Order.aggregate([
    { $match: completedOrderMatch(currency, range.start, range.end) },
    { $unwind: "$items" },
    {
      $group: {
        _id: { title: "$items.title", itemType: "$items.itemType" },
        orders: { $sum: 1 },
        revenue: { $sum: "$items.price" },
      },
    },
    { $sort: { revenue: -1, orders: -1 } },
    { $limit: 8 },
  ]);

  return rows.map((row) => ({
    title: String(row._id?.title || "Untitled"),
    itemType: String(row._id?.itemType || "product"),
    orders: number(row.orders),
    revenue: number(row.revenue),
  }));
}

async function coupons(
  currency: SupportedCurrency,
  range: { start: Date; end: Date }
): Promise<MarketingCouponRow[]> {
  const rows = await Order.aggregate([
    {
      $match: {
        ...completedOrderMatch(currency, range.start, range.end),
        discountCode: { $exists: true, $ne: "" },
      },
    },
    {
      $group: {
        _id: "$discountCode",
        orders: { $sum: 1 },
        savings: { $sum: "$discountAmount" },
      },
    },
    { $sort: { orders: -1, savings: -1 } },
    { $limit: 8 },
  ]);

  return rows.map((row) => ({
    code: String(row._id || "—"),
    orders: number(row.orders),
    savings: number(row.savings),
  }));
}

async function metaHealth(
  currency: SupportedCurrency,
  range: { start: Date; end: Date }
) {
  const rows = await Order.aggregate([
    { $match: completedOrderMatch(currency, range.start, range.end) },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        reported: { $sum: { $cond: [{ $eq: ["$meta.reported", true] }, 1, 0] } },
        failed: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$meta.reported", false] },
                  { $ne: [{ $ifNull: ["$meta.error", ""] }, ""] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const row = rows[0];
  const total = number(row?.total);
  const reported = number(row?.reported);
  const failed = number(row?.failed);
  return {
    configured: isMetaPurchaseEnabled(),
    reported,
    failed,
    unreported: Math.max(0, total - reported - failed),
  };
}

export async function getMarketingAnalytics(
  period: MarketingPeriod,
  currency: SupportedCurrency,
  now = new Date()
): Promise<MarketingAnalyticsData> {
  await connectDb();
  const { start, end, previousStart, previousEnd } = marketingPeriodWindow(period, now);
  const [current, previous, dailyTrend, sourceRows, productRows, couponRows, meta] =
    await Promise.all([
      summarize(currency, { start, end }),
      summarize(currency, { start: previousStart, end: previousEnd }),
      trend(currency, { start, end }),
      sourceBreakdown(currency, { start, end }),
      products(currency, { start, end }),
      coupons(currency, { start, end }),
      metaHealth(currency, { start, end }),
    ]);

  return {
    period,
    currency,
    start: start.toISOString(),
    end: end.toISOString(),
    current,
    previous,
    trend: dailyTrend,
    sources: sourceRows,
    products: productRows,
    coupons: couponRows,
    meta,
  };
}
