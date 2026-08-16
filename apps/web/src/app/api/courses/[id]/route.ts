import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { emitEvent } from "@/lib/events/emit";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (typeof body.title === "string" && body.title.trim()) {
      course.title = body.title.trim();
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      const raw = body.slug.trim().toLowerCase();
      const clash = await Course.findOne({ slug: raw, _id: { $ne: course._id } });
      if (clash) {
        return NextResponse.json({ error: `Slug "${raw}" is already in use` }, { status: 409 });
      }
      course.slug = raw;
    }
    for (const field of ["badge", "subtitle", "description", "level", "language", "pace"] as const) {
      if (typeof body[field] === "string") course[field] = body[field].trim();
    }
    if (typeof body.price === "number") course.price = Math.max(0, body.price);
    if (typeof body.currency === "string" && body.currency.trim()) {
      course.currency = body.currency.trim();
    }
    if (typeof body.image === "string") course.image = body.image.trim() || undefined;
    if (typeof body.published === "boolean") course.published = body.published;
    if (typeof body.featured === "boolean") course.featured = body.featured;
    if (Array.isArray(body.modules)) {
      course.modules = body.modules as typeof course.modules;
    }

    await course.save();
    await emitEvent("course.updated", {
      course: { id: course._id.toString(), slug: course.slug, title: course.title },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("courses PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    await CourseEnrollment.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(course._id);
    await emitEvent("course.deleted", {
      course: { id: course._id.toString(), slug: course.slug, title: course.title },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("courses DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
