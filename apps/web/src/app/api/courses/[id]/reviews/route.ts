import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseReview } from "@/lib/models/course-review";
import { recalculateCourseRating } from "@/lib/reviews";
import mongoose from "mongoose";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const course = await Course.findById(params.id).select("_id").lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const [reviews, total] = await Promise.all([
      CourseReview.find({ course: course._id })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseReview.countDocuments({ course: course._id }),
    ]);

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        rating: r.rating,
        text: r.text,
        userName: (r.user as any)?.name ?? "Anonymous",
        userAvatar: (r.user as any)?.avatar ?? null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("reviews GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5" }, { status: 400 });
    }

    const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";

    await connectDb();

    const course = await Course.findById(params.id).select("_id").lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await CourseReview.findOne({ course: course._id, user: session.userId });
    if (existing) {
      existing.rating = rating;
      existing.text = text;
      await existing.save();
      await recalculateCourseRating(course._id);
      return NextResponse.json({ ok: true, updated: true });
    }

    await CourseReview.create({
      course: course._id,
      user: session.userId,
      rating,
      text,
    });

    await recalculateCourseRating(course._id);
    return NextResponse.json({ ok: true, created: true }, { status: 201 });
  } catch (error) {
    console.error("reviews POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();

    const course = await Course.findById(params.id).select("_id").lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const deleted = await CourseReview.findOneAndDelete({
      course: course._id,
      user: session.userId,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await recalculateCourseRating(course._id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reviews DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
