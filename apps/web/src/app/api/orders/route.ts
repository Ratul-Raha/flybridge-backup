import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { Order, type OrderDoc, type OrderItemType } from "@/lib/models/order";
import { createOrder, initiateOrderPayment, OrderError } from "@/lib/orders";
import { CouponError } from "@/lib/coupons";
import { isMetaPurchaseEnabled } from "@/lib/meta-capi";
import { ORDER_ITEM_TYPES } from "@/lib/models/order";
import { orderAttributionFromRequest } from "@/lib/order-attribution";
import { affiliateFromRequest } from "@/lib/affiliate-attribution";

function isOrderItemType(value: unknown): value is OrderItemType {
  return typeof value === "string" && (ORDER_ITEM_TYPES as readonly string[]).includes(value);
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    ""
  );
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
      .populate("user", "name email phone")
      .lean()) as unknown as (OrderDoc & {
      user?: { name?: string; email?: string; phone?: string };
    })[];

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        userName: o.user?.name ?? "",
        userEmail: o.user?.email ?? o.email ?? "",
        userPhone: o.user?.phone ?? null,
        items: o.items.map((i) => ({
          itemType: i.itemType,
          itemId: i.itemId,
          title: i.title ?? "",
          price: i.price,
        })),
        total: o.total,
        currency: o.currency,
        subtotal: o.subtotal ?? 0,
        discountAmount: o.discountAmount ?? 0,
        discountCode: o.discountCode ?? null,
        discountLabel: o.discountLabel ?? null,
        status: o.status,
        gateway: o.gateway ?? null,
        gatewayRef: o.gatewayRef ?? null,
        merchantTransactionId: o.merchantTransactionId ?? null,
        meta: o.meta
          ? {
              reported: o.meta.reported ?? false,
              reportedAt: o.meta.reportedAt ?? null,
              error: o.meta.error ?? null,
            }
          : null,
        createdAt: o.createdAt,
      })),
      // Server-side Purchase delivery, so the dashboard can prove Meta received
      // the conversions rather than only logging that we tried.
      metaReporting: {
        pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? null,
        enabled: isMetaPurchaseEnabled(),
        reported: orders.filter((o) => o.meta?.reported).length,
        failed: orders.filter((o) => o.meta && !o.meta.reported).length,
        untracked: orders.filter((o) => !o.meta).length,
      },
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
    if (typeof body.name === "string" && body.name.trim() && body.name.trim() !== user.name) {
      user.name = body.name.trim();
    }
    if (typeof body.phone === "string" && body.phone.trim()) {
      user.phone = body.phone.trim();
    }
    if (typeof body.email === "string" && body.email.trim() && body.email.trim() !== user.email) {
      user.email = body.email.trim().toLowerCase();
    }
    await user.save();

    const { order, requiresPayment, duplicate } = await createOrder({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
      },
      itemType: body.itemType,
      itemId: body.itemId,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      code: typeof body.code === "string" ? body.code : undefined,
      attribution: orderAttributionFromRequest(request),
      affiliate: affiliateFromRequest(request),
    });

    let paymentUrl: string | null = null;

    if (requiresPayment && order) {
      const { url } = await initiateOrderPayment({
        order: order as OrderDoc & { save(): Promise<unknown> },
        origin: request.nextUrl.origin,
        customer: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone ?? null,
        },
        ipAddress: clientIp(request),
      });
      paymentUrl = url;
    }

    return NextResponse.json(
      {
        ok: true,
        order: order
          ? {
              id: order._id.toString(),
              status: order.status,
              subtotal: order.subtotal ?? 0,
              discountAmount: order.discountAmount ?? 0,
              discountCode: order.discountCode ?? null,
              discountLabel: order.discountLabel ?? null,
              total: order.total,
              currency: order.currency,
            }
          : null,
        requiresPayment,
        duplicate,
        paymentUrl,
      },
      { status: duplicate ? 200 : 201 }
    );
  } catch (error) {
    console.error("orders POST error", error);
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message },
      { status: message === "Product not found" ? 400 : 500 }
    );
  }
}
