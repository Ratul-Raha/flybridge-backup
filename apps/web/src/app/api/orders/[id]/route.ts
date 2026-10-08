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

const GATEWAYS = ["stripe", "eps", "manual"] as const;

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

    const hasStatus = typeof body.status !== "undefined";
    const hasGateway = typeof body.gateway !== "undefined";

    if (hasStatus && !isOrderStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (hasGateway && body.gateway !== null && !(GATEWAYS as readonly string[]).includes(body.gateway)) {
      return NextResponse.json({ error: "Invalid gateway" }, { status: 400 });
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (hasGateway) {
      const gateway = body.gateway as string | null;
      order.gateway = gateway || null;
    }

    if (hasStatus && body.status !== "completed") {
      order.status = body.status;
    }
    await order.save();

    if (hasStatus && body.status === "completed") {
      // Fulfill the order (creates enrollments) and backfill any that are
      // missing, whether the order is being completed now or was already
      // marked completed through a path that skipped fulfillment.
      await fulfillOrderAccess(params.id);
    }

    const updatedOrder = await Order.findById(params.id);
    return NextResponse.json({
      ok: true,
      status: updatedOrder?.status ?? order.status,
      gateway: updatedOrder?.gateway ?? null,
    });
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
