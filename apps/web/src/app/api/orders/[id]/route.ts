import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/lib/models/order";
import { User } from "@/lib/models/user";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { SeminarRegistration } from "@/lib/models/seminar";
import { MockTestEnrollment } from "@/lib/models/mock-test-enrollment";
import { deleteOrdersWithCascade, fulfillOrder, type HydratedOrder } from "@/lib/orders";

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

async function resolveOrderUserFromEmail(order: HydratedOrder): Promise<HydratedOrder> {
  if (order.user || !order.email) return order;

  const user = await User.findOne({ email: String(order.email).trim().toLowerCase() })
    .select("_id email")
    .lean<{ _id: unknown; email?: string } | null>();

  if (user && user._id) {
    order.user = user._id as typeof order.user;
    await order.save();
  }

  return order;
}

/**
 * Ensures enrollments/registrations exist for a completed order.
 * Used to backfill enrollments for orders that were marked completed
 * but never had their fulfillment logic run.
 */
async function ensureOrderFulfillment(order: HydratedOrder): Promise<void> {
  if (order.status !== "completed") return;

  const resolvedOrder = await resolveOrderUserFromEmail(order);
  if (!resolvedOrder.user) return;

  for (const item of resolvedOrder.items ?? []) {
    if (item.itemType === "course") {
      const existing = await CourseEnrollment.findOne({
        user: resolvedOrder.user,
        course: item.itemId,
      });

      if (!existing) {
        await CourseEnrollment.findOneAndUpdate(
          { user: resolvedOrder.user, course: item.itemId },
          {
            $setOnInsert: { user: resolvedOrder.user, course: item.itemId },
            $set: {
              order: resolvedOrder._id,
              status: "active",
              lessonsPlayed: 0,
              lessonsOpened: [],
              mockTestsPlayed: 0,
              refundForfeitedAt: null,
              refundForfeitedReason: null,
            },
          },
          { upsert: true, new: true }
        );
      }
    } else if (item.itemType === "seminar") {
      const existing = await SeminarRegistration.findOne({
        seminar: item.itemId,
        email: resolvedOrder.email,
      });

      if (!existing) {
        await SeminarRegistration.findOneAndUpdate(
          { seminar: item.itemId, email: resolvedOrder.email },
          {
            $setOnInsert: {
              seminar: item.itemId,
              user: resolvedOrder.user,
              name: resolvedOrder.email?.split("@")[0] ?? "",
              phone: "",
              email: resolvedOrder.email,
            },
          },
          { upsert: true, new: true }
        );
      }
    } else if (item.itemType === "mock-bundle") {
      const existing = await MockTestEnrollment.findOne({
        user: resolvedOrder.user,
        bundle: item.itemId,
      });

      if (!existing) {
        await MockTestEnrollment.findOneAndUpdate(
          { user: resolvedOrder.user, bundle: item.itemId },
          {
            $setOnInsert: { user: resolvedOrder.user, bundle: item.itemId },
            $set: {
              order: resolvedOrder._id,
              status: "active",
              refundForfeitedAt: null,
              refundForfeitedReason: null,
            },
          },
          { upsert: true, new: true }
        );
      }
    }
  }
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

    if (body.status === "completed" && order.status !== "completed") {
      const hydratedOrder = await Order.findById(params.id);
      if (hydratedOrder) {
        const fixedOrder = await resolveOrderUserFromEmail(hydratedOrder as HydratedOrder);
        await fulfillOrder(fixedOrder as HydratedOrder);
      }
    } else if (body.status === "completed" && order.status === "completed") {
      const hydratedOrder = await Order.findById(params.id);
      if (hydratedOrder) {
        await ensureOrderFulfillment(hydratedOrder as HydratedOrder);
      }
    } else {
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
