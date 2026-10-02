import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { Order, type OrderItemType, ORDER_ITEM_TYPES } from "@/lib/models/order";
import { Course } from "@/lib/models/course";

/**
 * Tells a buyer whether they can still buy something, before they are charged.
 *
 * Signed in, the account is the answer. Signed out — or signed in as somebody
 * else — the email they type is, because that is the only thing that identifies
 * them yet. This is deliberately only a yes/no: it never says whose account the
 * email belongs to or anything about an order.
 */
export async function POST(request: NextRequest) {
  const gate = rateLimit(`order-check:${clientIp(request)}`, 20, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { available: false, message: "Too many attempts. Please try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    if (
      typeof body.itemType !== "string" ||
      !(ORDER_ITEM_TYPES as readonly string[]).includes(body.itemType)
    ) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }
    if (typeof body.itemId !== "string" || !body.itemId.trim()) {
      return NextResponse.json({ error: "An item is required" }, { status: 400 });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    await connectDb();
    const session = await readSession();
    const itemType = body.itemType as OrderItemType;
    const itemId = body.itemId.trim();

    // Already enrolled on this account? No second purchase is needed.
    if (session?.userId && itemType === "course") {
      const enrolled = await CourseEnrollment.exists({
        user: session.userId,
        course: itemId,
        status: "active",
      });
      if (enrolled) {
        return NextResponse.json({
          available: false,
          reason: "enrolled",
          message: "You are already enrolled in this course.",
        });
      }
    }

    const owned = session?.userId || email
      ? await Order.exists({
          items: { $elemMatch: { itemType, itemId } },
          status: { $in: ["completed", "pending"] },
          $or: [
            ...(session?.userId ? [{ user: session.userId }] : []),
            ...(email ? [{ email }] : []),
          ],
        })
      : false;

    if (owned) {
      return NextResponse.json({
        available: false,
        reason: "purchased",
        message:
          "You have already purchased this with that email. Sign in with it to continue.",
      });
    }

    // A course that has been unpublished since the page was rendered should not
    // be purchasable, so the pre-check reports the same thing the order will.
    if (itemType === "course") {
      const course = await Course.findById(itemId)
        .select("published upcoming")
        .lean<{ published?: boolean; upcoming?: boolean } | null>();
      if (!course || (!course.published && !course.upcoming)) {
        return NextResponse.json({
          available: false,
          reason: "unavailable",
          message: "This course is not available for purchase right now.",
        });
      }
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("order check error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}