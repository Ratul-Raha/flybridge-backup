import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseWishlist } from "@/lib/models/wishlist";
import { WISHLIST_SCHOLARSHIP_USD } from "@/lib/wishlist";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const key = params.id;
    const isObjectId = Types.ObjectId.isValid(key);
    const course = await Course.findOne(
      isObjectId ? { _id: key } : { slug: key.toLowerCase() }
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const entries = await CourseWishlist.find({ course: course._id }).sort({
      createdAt: -1,
    });

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const rows = entries.map((e) => ({
      id: e._id.toString(),
      userId: e.user ? String(e.user) : "",
      name: e.name,
      email: e.email ?? "",
      phone: e.phone ?? "",
      source: e.source ?? "waitlist",
      scholarshipUsd: e.scholarshipUsd ?? WISHLIST_SCHOLARSHIP_USD,
      joinedAt: e.createdAt,
    }));

    return NextResponse.json({
      course: {
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
      },
      stats: {
        total: rows.length,
        thisWeek: rows.filter((r) => new Date(r.joinedAt) >= startOfWeek).length,
        today: rows.filter((r) => new Date(r.joinedAt) >= startOfToday).length,
        withEmail: rows.filter((r) => r.email).length,
        withPhone: rows.filter((r) => r.phone).length,
        scholarshipValue: rows.reduce((sum, r) => sum + (r.scholarshipUsd ?? 0), 0),
      },
      entries: rows,
    });
  } catch (error) {
    console.error("course wishlist error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}