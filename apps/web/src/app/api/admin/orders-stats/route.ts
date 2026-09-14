import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order } from "@/lib/models/order";
import { USD_TO_BDT } from "@/lib/pricing";

/** Converts an order field into its USD equivalent based on the order currency. */
function usdStage(field: string) {
  return {
    $addFields: {
      usd: {
        $cond: [
          { $eq: [{ $toUpper: { $ifNull: ["$currency", "USD"] } }, "BDT"] },
          { $divide: [`$${field}`, USD_TO_BDT] },
          `$${field}`,
        ],
      },
    },
  };
}

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

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
      Order.countDocuments(),
      Order.countDocuments({ status: "completed" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "failed" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({ status: "refunded" }),
      Order.countDocuments({ total: 0, status: "completed" }),
      Order.aggregate([
        { $match: { status: "completed" } },
        usdStage("total"),
        { $group: { _id: null, total: { $sum: "$usd" }, avg: { $avg: "$usd" } } },
      ]),
      Order.aggregate([
        usdStage("total"),
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            revenue: { $sum: "$usd" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { status: "completed" } },
        usdStage("items.price"),
        {
          $group: {
            _id: { title: "$items.title", itemType: "$items.itemType" },
            orders: { $sum: 1 },
            revenue: { $sum: "$usd" },
            avgPrice: { $avg: "$usd" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 6 },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email")
        .lean(),
      (async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return Order.countDocuments({ createdAt: { $gte: start } });
      })(),
      (async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 1);
        return Order.countDocuments({ createdAt: { $gte: start, $lt: end } });
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

    return NextResponse.json({
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
        items: o.items.map((i) => ({ title: i.title, price: i.price, itemType: i.itemType })),
        total: o.total,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
      })),
      chart: { labels, counts, revenues },
    });
  } catch (error) {
    console.error("orders-stats error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
