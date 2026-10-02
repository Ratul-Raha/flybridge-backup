import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order } from "@/lib/models/order";

/**
 * Returns the current user's still-unpaid orders, so the dashboard can remind
 * them to finish a checkout they abandoned.
 */
export async function GET(_: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const orders = await Order.find({ user: session.userId, status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        title: o.items?.[0]?.title ?? "",
        itemType: o.items?.[0]?.itemType ?? "",
        total: o.total ?? 0,
        currency: o.currency ?? "USD",
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("orders pending GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
