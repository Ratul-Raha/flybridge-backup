import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/lib/models/order";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { SeminarRegistration } from "@/lib/models/seminar";
import { MockTestEnrollment } from "@/lib/models/mock-test-enrollment";
import { deleteOrdersWithCascade, fulfillOrder, type HydratedOrder } from "@/lib/orders";
import { Course } from "@/lib/models/course";
import { Seminar } from "@/lib/models/seminar";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/**
 * Ensures enrollments/registrations exist for a completed order.
 * Used to backfill enrollments for orders that were marked completed
 * but never had their fulfillment logic run.
 */
async function ensureOrderFulfillment(order: HydratedOrder): Promise<void> {
  if (order.status !== "completed") return;
  
  for (const item of order.items ?? []) {
    if (item.itemType === "course") {
      // Check if enrollment already exists
      const existing = await CourseEnrollment.findOne({
        user: order.user,
        course: item.itemId,
      });
      
      if (!existing) {
        // Create enrollment if missing
        await CourseEnrollment.findOneAndUpdate(
          { user: order.user, course: item.itemId },
          {
            $setOnInsert: { user: order.user, course: item.itemId },
            $set: {
              order: order._id,
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
      // Check if registration already exists
      const existing = await SeminarRegistration.findOne({
        seminar: item.itemId,
        email: order.email,
      });
      
      if (!existing) {
        // Create registration if missing
        await SeminarRegistration.findOneAndUpdate(
          { seminar: item.itemId, email: order.email },
          {
            $setOnInsert: {
              seminar: item.itemId,
              user: order.user,
              name: order.email?.split("@")[0] ?? "",
              phone: "",
              email: order.email,
            },
          },
          { upsert: true, new: true }
        );
      }
    } else if (item.itemType === "mock-bundle") {
      // Check if enrollment already exists
      const existing = await MockTestEnrollment.findOne({
        user: order.user,
        bundle: item.itemId,
      });
      
      if (!existing) {
        // Create enrollment if missing
        await MockTestEnrollment.findOneAndUpdate(
          { user: order.user, bundle: item.itemId },
          {
            $setOnInsert: { user: order.user, bundle: item.itemId },
            $set: {
              order: order._id,
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
      // Fulfill the order with proper hydration (includes .save() method)
      const hydratedOrder = await Order.findById(params.id);
      if (hydratedOrder) {
        await fulfillOrder(hydratedOrder as HydratedOrder);
      }
    } else if (body.status === "completed" && order.status === "completed") {
      // Order is already completed, but ensure enrollments exist
      // (fixes cases where order was marked completed without running fulfillment)
      const hydratedOrder = await Order.findById(params.id);
      if (hydratedOrder) {
        await ensureOrderFulfillment(hydratedOrder as HydratedOrder);
      }
    } else {
      // For all other status changes, just update the status
      order.status = body.status;
      await order.save();
    }

    // Fetch the updated order to return current state
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
