import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course, type CourseDoc } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { emitEvent } from "@/lib/events/emit";

function toDto(c: CourseDoc, enrollmentCount?: number, includeContent = false) {
  return {
    id: c._id.toString(),
    slug: c.slug,
    title: c.title,
    badge: c.badge ?? "",
    subtitle: c.subtitle ?? "",
    description: c.description ?? "",
    level: c.level ?? "",
    language: c.language ?? "",
    pace: c.pace ?? "",
    price: c.price ?? 0,
    currency: c.currency ?? "USD",
    image: c.image ?? null,
    published: c.published ?? false,
    featured: c.featured ?? false,
    upcoming: c.upcoming ?? false,
    averageRating: c.averageRating ?? 0,
    reviewCount: c.reviewCount ?? 0,
    ...(enrollmentCount !== undefined ? { enrollmentCount } : {}),
    modules: (c.modules ?? []).map((m) => ({
      title: m.title,
      lessons: (m.lessons ?? []).map((l) => ({
        title: l.title,
        duration: l.duration ?? "",
        ...(includeContent ? { videoUrl: l.videoUrl ?? "", pdfUrl: l.pdfUrl ?? "" } : {}),
      })),
    })),
    books: (c.books ?? []).map((b) => ({
      title: b.title,
      description: b.description ?? "",
      ...(includeContent ? { pdfUrl: b.pdfUrl } : {}),
    })),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const slug = searchParams.get("slug");

  try {
    await connectDb();

    if (all) {
      const session = await readSession();
      if (!isManager(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const courses = await Course.find().sort({ createdAt: -1 });
      const enrollCounts = await CourseEnrollment.aggregate([
        { $group: { _id: "$course", count: { $sum: 1 } } },
      ]);
      const enrollMap = new Map(enrollCounts.map((r) => [r._id.toString(), r.count as number]));
      return NextResponse.json({
        courses: courses.map((c) => toDto(c, enrollMap.get(c._id.toString()) ?? 0, true)),
      });
    }

    if (slug) {
      const course = await Course.findOne({ slug, published: true });
      if (!course) return NextResponse.json({ course: null });
      return NextResponse.json({ course: toDto(course) });
    }

    const courses = await Course.find({
      $or: [{ published: true }, { upcoming: true }],
    }).sort({ createdAt: -1 });
    return NextResponse.json({ courses: courses.map(toDto) });
  } catch (error) {
    console.error("courses GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const rawSlug =
      typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : slugify(title);
    const existing = await Course.findOne({ slug: rawSlug });
    if (existing) {
      return NextResponse.json(
        { error: `A course with slug "${rawSlug}" already exists` },
        { status: 409 },
      );
    }

    const course = await Course.create({
      slug: rawSlug,
      title,
      badge: typeof body.badge === "string" ? body.badge.trim() : "",
      subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
      description: typeof body.description === "string" ? body.description.trim() : "",
      level: typeof body.level === "string" ? body.level.trim() : "",
      language: typeof body.language === "string" ? body.language.trim() : "",
      pace: typeof body.pace === "string" ? body.pace.trim() : "",
      price: Math.max(0, Number(body.price) || 0),
      currency:
        typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "USD",
      image: typeof body.image === "string" ? body.image.trim() || undefined : undefined,
      published: body.published === true,
      featured: body.featured === true,
      upcoming: body.upcoming === true,
      modules: normalizeModules(body.modules),
      books: normalizeBooks(body.books),
      createdBy: session!.userId,
    });

    await emitEvent("course.created", {
      course: {
        id: course._id.toString(),
        slug: course.slug,
        title: course.title,
        badge: course.badge,
        price: course.price,
        image: course.image,
      },
      actor: { name: session?.name, email: session?.email, userId: session?.userId },
    });

    return NextResponse.json({ course: toDto(course) }, { status: 201 });
  } catch (error) {
    console.error("courses POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function normalizeModules(
  raw: unknown,
): {
  title: string;
  lessons: { title: string; duration?: string; videoUrl?: string; pdfUrl?: string }[];
}[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      const mod = (m ?? {}) as Record<string, unknown>;
      const title = typeof mod.title === "string" ? mod.title.trim() : "";
      const lessons = Array.isArray(mod.lessons)
        ? mod.lessons
            .map((l) => {
              const lesson = (l ?? {}) as Record<string, unknown>;
              return {
                title: typeof lesson.title === "string" ? lesson.title.trim() : "",
                duration: typeof lesson.duration === "string" ? lesson.duration.trim() : "",
                videoUrl: typeof lesson.videoUrl === "string" ? lesson.videoUrl.trim() : "",
                pdfUrl: typeof lesson.pdfUrl === "string" ? lesson.pdfUrl.trim() : "",
              };
            })
            .filter((l) => l.title)
        : [];
      return { title, lessons };
    })
    .filter((m) => m.title || m.lessons.length > 0);
}

function normalizeBooks(raw: unknown): { title: string; description: string; pdfUrl: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => {
      const book = (b ?? {}) as Record<string, unknown>;
      return {
        title: typeof book.title === "string" ? book.title.trim() : "",
        description: typeof book.description === "string" ? book.description.trim() : "",
        pdfUrl: typeof book.pdfUrl === "string" ? book.pdfUrl.trim() : "",
      };
    })
    .filter((b) => b.title && b.pdfUrl);
}
