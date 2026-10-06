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
  if (!order.email) return order;

  const normalizedEmail = String(order.email).trim().toLowerCase();

  // If user is already set and valid, keep it
  if (order.user && typeof order.user === "object") {
    return order;
  }

  const user = await User.findOne({ email: normalizedEmail }).select("_id email").lean();

  if (!user?._id) return order;

  // Fix stale or missing user linkage
  if (!order.user || order.user.toString() !== user._id.toString()) {
    order.user = user._id as typeof order.user;
    await order.save();
  }

  return order;
}

/**
 * Backfill missing enrollments for a completed order.
 * Ensures the user has access even if fulfillOrder() didn't create the record.
 */
async function backfillMissingEnrollments(order: HydratedOrder): Promise<void> {
  if (order.status !== "completed" || !order.user) return;

  for (const item of order.items ?? []) {
    if (item.itemType === "course") {
      const exists = await CourseEnrollment.findOne({
        user: order.user,
        course: item.itemId,
      });

      if (!exists) {
        await CourseEnrollment.create({
          user: order.user,
          course: item.itemId,
          order: order._id,
          status: "active",
          lessonsPlayed: 0,
          lessonsOpened: [],
          mockTestsPlayed: 0,
          refundForfeitedAt: null,
          refundForfeitedReason: null,
        });
      }
    } else if (item.itemType === "seminar") {
      const exists = await SeminarRegistration.findOne({
        seminar: item.itemId,
        email: order.email,
      });

      if (!exists) {
        await SeminarRegistration.create({
          seminar: item.itemId,
          user: order.user,
          name: order.email?.split("@")[0] ?? "Guest",
          phone: "",
          email: order.email,
        });
      }
    } else if (item.itemType === "mock-bundle") {
      const exists = await MockTestEnrollment.findOne({
        user: order.user,
        bundle: item.itemId,
      });

      if (!exists) {
        await MockTestEnrollment.create({
          user: order.user,
          bundle: item.itemId,
          order: order._id,
          status: "active",
          refundForfeitedAt: null,
          refundForfeitedReason: null,
        });
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
      if (!hydratedOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Resolve missing or stale user linkage
      const fixedOrder = await resolveOrderUserFromEmail(hydratedOrder as HydratedOrder);
      
      // Fulfill the order (creates enrollments)
      await fulfillOrder(fixedOrder as HydratedOrder);
      
      // Backfill any missing enrollments in case fulfillOrder didn't create them
      await backfillMissingEnrollments(fixedOrder as HydratedOrder);
    } else if (body.status === "completed" && order.status === "completed") {
      // Order already completed but needs backfill
      const hydratedOrder = await Order.findById(params.id);
      if (hydratedOrder) {
        const fixedOrder = await resolveOrderUserFromEmail(hydratedOrder as HydratedOrder);
        await backfillMissingEnrollments(fixedOrder as HydratedOrder);
      }
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
