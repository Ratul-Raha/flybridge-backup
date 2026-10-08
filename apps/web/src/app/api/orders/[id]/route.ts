import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/lib/models/order";
import {
  deleteOrdersWithCascade,
  fulfillOrderAccess,
} from "@/lib/orders";

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    if (!isOrderStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (body.status === "completed") {
      // Fulfill the order (creates enrollments) and backfill any that are
      // missing, whether the order is being completed now or was already
      // marked completed through a path that skipped fulfillment.
      await fulfillOrderAccess(params.id);
    } else {
      // For all other status changes, just update the status
      order.status = body.status;
      await order.save();
    }

    const updatedOrder = await Order.findById(params.id);
    return NextResponse.json({ ok: true, status: updatedOrder?.status ?? order.status });
  } catch (error) {
    console.error("orders PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await deleteOrdersWithCascade([order._id]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("orders DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
