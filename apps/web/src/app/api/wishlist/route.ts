import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseWishlist } from "@/lib/models/wishlist";
import { User } from "@/lib/models/user";
import { orderAttributionFromRequest } from "@/lib/order-attribution";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const slug =
    typeof body.slug === "string" ? body.slug.toLowerCase().trim() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "waitlist";

  if (!slug) return NextResponse.json({ error: "Course is required" }, { status: 400 });

  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: "Sign in to join the waitlist" },
      { status: 401 }
    );
  }

  try {
    await connectDb();

    const course = await Course.findOne({ slug });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (!course.waitlistEnabled) {
      return NextResponse.json(
        { error: "The waitlist isn't open for this course." },
        { status: 400 }
      );
    }

    const courseId = course._id;
    const discountPercent = course.wishlistDiscountPercent ?? 0;
    const attribution = orderAttributionFromRequest(request);

    const user = await User.findById(session.userId).select("name email phone");
    const name = user?.name?.trim() || session.name?.trim() || "Student";
    const email = user?.email?.toLowerCase() || session.email?.toLowerCase() || "";
    const phone = user?.phone?.trim() || "";
    const userId = new Types.ObjectId(session.userId);

    const match: Record<string, unknown>[] = [{ user: userId }];
    if (email) match.push({ email });

    let entry = await CourseWishlist.findOne({ course: courseId, $or: match });
    let alreadyJoined = false;

    if (entry) {
      alreadyJoined = true;
      const update: Record<string, unknown> = {};
      if (!entry.user) update.user = userId;
      if (name && entry.name !== name) update.name = name;
      if (email && entry.email !== email) update.email = email;
      if (phone && entry.phone !== phone) update.phone = phone;
      if (entry.discountPercent !== discountPercent) update.discountPercent = discountPercent;
      if (!entry.attribution) update.attribution = attribution;
      if (Object.keys(update).length) {
        await CourseWishlist.updateOne({ _id: entry._id }, { $set: update });
      }
    } else {
      entry = await CourseWishlist.create({
        course: courseId,
        user: userId,
        name,
        email: email || undefined,
        phone: phone || undefined,
        source,
        attribution,
        discountPercent,
      });
    }

    return NextResponse.json(
      {
        alreadyJoined,
        discountPercent: entry.discountPercent ?? discountPercent,
        entry: {
          id: entry._id.toString(),
          name: entry.name,
          email: entry.email ?? "",
          phone: entry.phone ?? "",
          joinedAt: entry.createdAt,
        },
      },
      { status: alreadyJoined ? 200 : 201 }
    );
  } catch (error) {
    console.error("wishlist join error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
