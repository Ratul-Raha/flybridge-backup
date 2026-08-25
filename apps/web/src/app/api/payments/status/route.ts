import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { reconcileOrder, isStripeConfigured } from "@/lib/payments/stripe";

export async function GET(request: Request) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured" },
        { status: 503 }
      );
    }

    const result = await reconcileOrder(orderId, {
      id: session.userId,
      name: session.name,
      email: session.email,
      isAdmin: session.role === "admin",
    });

    return NextResponse.json({
      ok: true,
      status: result.status,
      orderId: result.orderId,
      itemType: result.itemType ?? null,
      itemId: result.itemId ?? null,
    });
  } catch (error) {
    console.error("payments status error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message },
      { status: message === "Forbidden" ? 403 : message === "Order not found" ? 404 : 500 }
    );
  }
}
