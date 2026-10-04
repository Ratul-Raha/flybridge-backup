import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/lib/models/order";
import { deleteOrdersWithCascade } from "@/lib/orders";

const MAX_ORDERS = 500;

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const orderIds: unknown = body?.orderIds;
    const action: unknown = body?.action;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || orderIds.length > MAX_ORDERS) {
      return NextResponse.json({ error: `Select between 1 and ${MAX_ORDERS} orders` }, { status: 400 });
    }
    if (action !== "status" && action !== "delete") {
      return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
    }

    await connectDb();
    const ids = [...new Set(orderIds.map(String))].filter((id) => Types.ObjectId.isValid(id));
    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid orders selected" }, { status: 400 });
    }

    if (action === "status") {
      const value = body?.value;
      if (!isOrderStatus(value)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const result = await Order.updateMany({ _id: { $in: ids } }, { $set: { status: value } });
      return NextResponse.json({ ok: true, updated: result.modifiedCount });
    }

    // delete
    await deleteOrdersWithCascade(ids.map((id) => new Types.ObjectId(id)));
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (error) {
    console.error("orders bulk error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
