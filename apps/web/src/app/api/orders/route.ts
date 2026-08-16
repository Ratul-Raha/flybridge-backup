import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { Order, type OrderDoc, type OrderItemType } from "@/lib/models/order";
import { createOrder } from "@/lib/orders";
import { ORDER_ITEM_TYPES } from "@/lib/models/order";

function isOrderItemType(value: unknown): value is OrderItemType {
  return typeof value === "string" && (ORDER_ITEM_TYPES as readonly string[]).includes(value);
}

export async function GET() {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const orders = (await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .lean()) as unknown as (OrderDoc & {
      user?: { name?: string; email?: string };
    })[];

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        userName: o.user?.name ?? "",
        userEmail: o.user?.email ?? o.email ?? "",
        items: o.items.map((i) => ({
          itemType: i.itemType,
          itemId: i.itemId,
          title: i.title ?? "",
          price: i.price,
        })),
        total: o.total,
        currency: o.currency,
        status: o.status,
        gateway: o.gateway ?? null,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("orders GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await connectDb();

    if (!isOrderItemType(body.itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
    if (typeof body.itemId !== "string" || !body.itemId.trim()) {
      return NextResponse.json({ error: "An item is required" }, { status: 400 });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (typeof body.phone === "string" && body.phone.trim()) {
      user.phone = body.phone.trim();
      await user.save();
    }

    const { order, requiresPayment } = await createOrder({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
      },
      itemType: body.itemType,
      itemId: body.itemId,
    });

    return NextResponse.json(
      {
        ok: true,
        order: {
          id: order._id.toString(),
          status: order.status,
          total: order.total,
          currency: order.currency,
        },
        requiresPayment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("orders POST error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message },
      { status: message === "Product not found" ? 400 : 500 }
    );
  }
}
