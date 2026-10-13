import "server-only";

import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db";
import { Order } from "@/lib/models/order";
import type { SupportedCurrency } from "@/lib/pricing";

export type OrderStatsItem = {
  title: string;
  itemType: string;
  orders: number;
  revenue: number;
  avgPrice: number;
};

export type OrderStatsRecent = {
  id: string;
  userName: string;
  userEmail: string;
  items: { title: string; price: number; itemType: string }[];
  total: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type OrderStats = {
  currency: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  freeOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  thisMonthOrders: number;
  lastMonthOrders: number;
  monthlyGrowth: number;
  topItems: OrderStatsItem[];
  statusDistribution: { status: string; count: number }[];
  recentOrders: OrderStatsRecent[];
  chart: { labels: string[]; counts: number[]; revenues: number[] };
};

async function computeOrdersStatsUncached(
  currency: SupportedCurrency
): Promise<OrderStats> {
  await connectDb();

  // Orders are created with uppercase codes ("USD"/"BDT"); the lowercase
  // variant only exists defensively for legacy rows. Exact matches use the
  // { currency, status, createdAt } compound index.
  const match = {
    currency: { $in: [currency, currency.toLowerCase()] },
  };

  const [
    totalOrders,
    completedOrders,
    pendingOrders,
    failedOrders,
    cancelledOrders,
    refundedOrders,
    freeOrders,
    revenueAgg,
    dailyAgg,
    topItems,
    statusDist,
    recentOrders,
    thisMonthOrders,
    lastMonthOrders,
  ] = await Promise.all([
    Order.countDocuments(match),
    Order.countDocuments({ ...match, status: "completed" }),
    Order.countDocuments({ ...match, status: "pending" }),
    Order.countDocuments({ ...match, status: "failed" }),
    Order.countDocuments({ ...match, status: "cancelled" }),
    Order.countDocuments({ ...match, status: "refunded" }),
    Order.countDocuments({ ...match, total: 0, status: "completed" }),
    Order.aggregate([
      { $match: { ...match, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$total" }, avg: { $avg: "$total" } } },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$total", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...match, status: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { title: "$items.title", itemType: "$items.itemType" },
          orders: { $sum: 1 },
          revenue: { $sum: "$items.price" },
          avgPrice: { $avg: "$items.price" },
        },
      },
      { $sort: { orders: -1 } },
      { $limit: 6 },
    ]),
    Order.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.find(match)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .lean(),
    (async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return Order.countDocuments({ ...match, createdAt: { $gte: start } });
    })(),
    (async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return Order.countDocuments({ ...match, createdAt: { $gte: start, $lt: end } });
    })(),
  ]);

  const now = new Date();
  const days = 30;
  const from = new Date();
  from.setDate(now.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  const labels: string[] = [];
  const counts: number[] = [];
  const revenues: number[] = [];
  const dailyMap = new Map(dailyAgg.map((d) => [d._id, { count: d.count, revenue: d.revenue }]));

  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    counts.push(dailyMap.get(key)?.count ?? 0);
    revenues.push(dailyMap.get(key)?.revenue ?? 0);
  }

  const monthlyGrowth =
    lastMonthOrders > 0
      ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : thisMonthOrders > 0
      ? 100
      : 0;

  return {
    currency,
    totalOrders,
    completedOrders,
    pendingOrders,
    failedOrders,
    cancelledOrders,
    refundedOrders,
    freeOrders,
    totalRevenue: revenueAgg[0]?.total ?? 0,
    avgOrderValue: Math.round(revenueAgg[0]?.avg ?? 0),
    thisMonthOrders,
    lastMonthOrders,
    monthlyGrowth,
    topItems: topItems.map((t) => ({
      title: t._id.title || "Untitled",
      itemType: t._id.itemType,
      orders: t.orders,
      revenue: t.revenue,
      avgPrice: Math.round(t.avgPrice),
    })),
    statusDistribution: statusDist.map((s) => ({
      status: s._id,
      count: s.count,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o._id.toString(),
      userName: (o as unknown as { user?: { name?: string } }).user?.name ?? "",
      userEmail: (o as unknown as { user?: { email?: string } }).user?.email ?? o.email ?? "",
      items: o.items.map((i) => ({
        title: i.title ?? "Untitled",
        price: i.price,
        itemType: i.itemType,
      })),
      total: o.total,
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    chart: { labels, counts, revenues },
  };
}

export const getOrdersStats = unstable_cache(
  (currency: SupportedCurrency) => computeOrdersStatsUncached(currency),
  ["admin", "orders-stats"],
  { revalidate: 30 }
);
