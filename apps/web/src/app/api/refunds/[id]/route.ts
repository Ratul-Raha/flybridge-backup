import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Order } from "@/lib/models/order";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { MockTestEnrollment } from "@/lib/models/mock-test-enrollment";
import { RefundRequest } from "@/lib/models/refund-request";
import { refundStripeOrder } from "@/lib/payments/stripe";

const ACTIONS = ["approve", "decline", "mark_refunded"] as const;
type Action = (typeof ACTIONS)[number];

function isStaff(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

/** Closes the order and takes the purchased content away in the same step. */
async function revokeAccess(refund: {
  order: unknown;
  enrollment?: unknown;
  itemType?: string | null;
}) {
  const order = await Order.findById(refund.order);
  if (order) {
    order.status = "refunded";
    await order.save();
  }
  if (!refund.enrollment) return;

  // A bundle claim points at a MockTestEnrollment, not a CourseEnrollment, so
  // expiring the wrong collection would leave the mocks unlocked.
  if (refund.itemType === "mock-bundle") {
    await MockTestEnrollment.findByIdAndUpdate(refund.enrollment, { status: "expired" });
    return;
  }
  await CourseEnrollment.findByIdAndUpdate(refund.enrollment, { status: "expired" });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session || !session.userId || !isStaff(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminId = session.userId;

  try {
    const body = await request.json().catch(() => ({} as { action?: string; note?: string }));
    const action = body?.action as Action | undefined;
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";

    if (!action || !ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await connectDb();
    const refund = await RefundRequest.findById(params.id);
    if (!refund) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    if (action === "decline") {
      if (refund.status !== "pending") {
        return NextResponse.json({ error: "Only pending requests can be declined" }, { status: 409 });
      }
      refund.status = "declined";
      refund.adminNote = note;
      refund.decidedBy = adminId as never;
      refund.decidedAt = new Date();
      await refund.save();
      return NextResponse.json({ ok: true, status: refund.status });
    }

    if (action === "mark_refunded") {
      if (refund.status !== "approved" && refund.status !== "failed") {
        return NextResponse.json({ error: "Only approved requests can be paid out" }, { status: 409 });
      }
      refund.status = "refunded";
      refund.refundedAt = new Date();
      refund.gatewayRefundId = refund.gatewayRefundId ?? "manual";
      refund.failureReason = null;
      refund.adminNote = note || refund.adminNote;
      refund.decidedBy = adminId as never;
      refund.decidedAt = refund.decidedAt ?? new Date();
      await refund.save();
      await revokeAccess(refund);
      return NextResponse.json({ ok: true, status: refund.status });
    }

    // approve
    if (refund.status !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be approved" }, { status: 409 });
    }

    const order = await Order.findById(refund.order);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    refund.decidedBy = adminId as never;
    refund.decidedAt = new Date();
    refund.adminNote = note;

    // Stripe pays out on its own. bKash/Nagad/Rocket and anything manual do not,
    // so those are approved for a human to send the money.
    if (order.gateway === "stripe") {
      const result = await refundStripeOrder(order);
      if (!result.ok) {
        refund.status = "failed";
        refund.failureReason = (result.error ?? "Stripe refund failed").slice(0, 500);
        await refund.save();
        return NextResponse.json(
          { error: `Automatic refund failed: ${refund.failureReason}`, status: refund.status },
          { status: 502 }
        );
      }
      refund.status = "refunded";
      refund.refundedAt = new Date();
      refund.gatewayRefundId = result.refundId ?? null;
      refund.failureReason = null;
      await refund.save();
      await revokeAccess(refund);
      return NextResponse.json({ ok: true, status: refund.status, automatic: true });
    }

    refund.status = "approved";
    await refund.save();
    return NextResponse.json({
      ok: true,
      status: refund.status,
      automatic: false,
      message: "Approved. Send the refund manually, then mark it refunded.",
    });
  } catch (error) {
    console.error("refund decision error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
