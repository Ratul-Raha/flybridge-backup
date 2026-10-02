import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { Order } from "@/lib/models/order";
import { initiateOrderPayment, OrderError, type HydratedOrder } from "@/lib/orders";
import { clientIp } from "@/lib/rate-limit";

/**
 * Resumes an abandoned checkout: mints a fresh gateway session for a pending
 * order the caller owns and returns the URL to finish paying.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const order = (await Order.findById(params.id)) as HydratedOrder | null;
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.user.toString() !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "This order is no longer pending" }, { status: 409 });
    }

    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { url } = await initiateOrderPayment({
      order,
      origin: request.nextUrl.origin,
      customer: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
      },
      ipAddress: clientIp(request),
    });

    return NextResponse.json({ ok: true, paymentUrl: url });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("orders resume error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
