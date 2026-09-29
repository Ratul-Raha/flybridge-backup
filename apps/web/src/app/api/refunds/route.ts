import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { RefundRequest } from "@/lib/models/refund-request";
import { claimRefund, RefundError } from "@/lib/refunds";
import { isRefundReason, refundReasonLabel } from "@/lib/refund-policy";

function isStaff(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();

    if (request.nextUrl.searchParams.get("scope") === "admin") {
      if (!isStaff(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const requests = await RefundRequest.find()
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("user", "name email")
        .lean();

      return NextResponse.json({
        requests: requests.map((r) => ({
          id: r._id.toString(),
          userId: r.user.toString(),
          userName:
            (r as unknown as { user?: { name?: string; email?: string } }).user?.name ?? "",
          userEmail:
            (r as unknown as { user?: { name?: string; email?: string } }).user?.email ?? "",
          orderId: r.order.toString(),
          itemTitle: r.itemTitle ?? "",
          amount: r.amount ?? 0,
          currency: r.currency ?? "USD",
          gateway: r.gateway ?? null,
          reasonCode: r.reasonCode ?? "",
          reasonLabel: refundReasonLabel(r.reasonCode),
          reason: r.reason ?? "",
          status: r.status,
          lessonsPlayedAtClaim: r.lessonsPlayedAtClaim ?? 0,
          mockTestsPlayedAtClaim: r.mockTestsPlayedAtClaim ?? 0,
          adminNote: r.adminNote ?? "",
          gatewayRefundId: r.gatewayRefundId ?? null,
          failureReason: r.failureReason ?? null,
          decidedAt: r.decidedAt ?? null,
          refundedAt: r.refundedAt ?? null,
          createdAt: r.createdAt,
        })),
      });
    }

    const requests = await RefundRequest.find({ user: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r._id.toString(),
        orderId: r.order.toString(),
        itemTitle: r.itemTitle ?? "",
        amount: r.amount ?? 0,
        currency: r.currency ?? "USD",
        reasonCode: r.reasonCode ?? "",
        reasonLabel: refundReasonLabel(r.reasonCode),
        reason: r.reason ?? "",
        status: r.status,
        adminNote: r.adminNote ?? "",
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("refunds GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(
      () => ({} as { orderId?: string; reasonCode?: string; reason?: string })
    );
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    const reasonCode = typeof body?.reasonCode === "string" ? body.reasonCode.trim() : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!orderId) {
      return NextResponse.json({ error: "Which order?" }, { status: 400 });
    }

    if (!isRefundReason(reasonCode)) {
      return NextResponse.json({ error: "Please choose a reason for the refund." }, { status: 400 });
    }

    const created = await claimRefund({
      userId: session.userId,
      orderId,
      reasonCode,
      reason,
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: created._id.toString(),
        orderId: created.order.toString(),
        status: created.status,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof RefundError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("refunds POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
