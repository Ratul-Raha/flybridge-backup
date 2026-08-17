import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order } from "@/lib/models/order";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      freeOrders,
      revenueAgg,
      dailyAgg,
      topItems,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "paid" }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: { $in: ["failed", "cancelled"] } }),
      Order.countDocuments({ total: 0 }),
      Order.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" }, avg: { $avg: "$total" } } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { status: "paid" } },
        {
          $group: {
            _id: { title: "$items.title", itemType: "$items.itemType" },
            orders: { $sum: 1 },
            revenue: { $sum: "$items.price" },
            avgPrice: { $avg: "$items.price" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 8 },
      ]),
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

    return NextResponse.json({
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      freeOrders,
      completedOrders: paidOrders + freeOrders,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      avgOrderValue: Math.round(revenueAgg[0]?.avg ?? 0),
      topItems: topItems.map((t) => ({
        title: t._id.title || "Untitled",
        itemType: t._id.itemType,
        orders: t.orders,
        revenue: t.revenue,
        avgPrice: Math.round(t.avgPrice),
      })),
      chart: { labels, counts, revenues },
    });
  } catch (error) {
    console.error("orders-stats error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
