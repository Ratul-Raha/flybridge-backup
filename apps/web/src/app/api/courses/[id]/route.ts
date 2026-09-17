import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { sanitizePrices } from "@/lib/pricing";
import { emitEvent } from "@/lib/events/emit";

type EditSession = { role: string; userId?: string; name?: string; email?: string } | null;

function isManager(session: EditSession) {
  return session && (session.role === "admin" || session.role === "moderator");
}

const COURSE_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  badge: "Badge",
  subtitle: "Subtitle",
  description: "Description",
  level: "Level",
  language: "Language",
  pace: "Pace",
  price: "Price",
  currency: "Currency",
  prices: "Prices",
  waitlistEnabled: "Waitlist enabled",
  wishlistDiscountPercent: "Wishlist discount",
  image: "Image",
  published: "Published",
  featured: "Featured",
  upcoming: "Upcoming",
  modules: "Modules",
  books: "Books",
};

function actorFor(session: EditSession, userId?: string) {
  return session
    ? { name: session.name, email: session.email, userId: userId ?? session.userId }
    : undefined;
}

function eq(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return String(a ?? "") === String(b ?? "");
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const before: Record<string, unknown> = {};
    for (const key of Object.keys(COURSE_FIELD_LABELS)) before[key] = course.get(key);

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
    for (const field of [
      "badge",
      "subtitle",
      "description",
      "level",
      "language",
      "pace",
    ] as const) {
      if (typeof body[field] === "string") course[field] = body[field].trim();
    }
    if (typeof body.price === "number") course.price = Math.max(0, body.price);
    if (typeof body.currency === "string" && body.currency.trim()) {
      course.currency = body.currency.trim();
    }
    const prices = sanitizePrices(body.prices);
    if (prices) course.prices = prices;
    if (typeof body.waitlistEnabled === "boolean") course.waitlistEnabled = body.waitlistEnabled;
    if (typeof body.wishlistDiscountPercent === "number") {
      course.wishlistDiscountPercent = Math.max(
        0,
        Math.min(100, body.wishlistDiscountPercent)
      );
    }
    if (typeof body.image === "string") course.image = body.image.trim() || undefined;
    if (typeof body.published === "boolean") course.published = body.published;
    if (typeof body.featured === "boolean") course.featured = body.featured;
    if (typeof body.upcoming === "boolean") course.upcoming = body.upcoming;
    if (Array.isArray(body.modules)) {
      course.modules = body.modules as typeof course.modules;
    }
    if (Array.isArray(body.books)) {
      course.books = body.books as typeof course.books;
    }

    await course.save();
    const changedFields = Object.keys(COURSE_FIELD_LABELS)
      .filter((key) => key in body && !eq(before[key], course.get(key)))
      .map((key) => COURSE_FIELD_LABELS[key]);
    await emitEvent("course.updated", {
      course: { id: course._id.toString(), slug: course.slug, title: course.title },
      actor: actorFor(session),
      changedFields,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("courses PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
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
      actor: actorFor(session),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("courses DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
