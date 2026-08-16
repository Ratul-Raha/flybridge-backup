import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course, type CourseDoc } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";

function toDto(c: CourseDoc) {
  return {
    id: c._id.toString(),
    slug: c.slug,
    title: c.title,
    badge: c.badge ?? "",
    subtitle: c.subtitle ?? "",
    description: c.description ?? "",
    price: c.price ?? 0,
    currency: c.currency ?? "BDT",
    image: c.image ?? null,
    published: c.published ?? false,
    modules: (c.modules ?? []).map((m) => ({
      title: m.title,
      lessons: (m.lessons ?? []).map((l) => ({
        title: l.title,
        duration: l.duration ?? "",
        videoUrl: l.videoUrl ?? "",
        pdfUrl: l.pdfUrl ?? "",
      })),
    })),
  };
}

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();

    const courses = await Course.find({ published: true }).sort({ createdAt: -1 });
    const enrollments = await CourseEnrollment.find({ user: session.userId, status: "active" })
      .select("course createdAt")
      .lean();
    const enrolledIds = new Set(enrollments.map((e) => e.course.toString()));

    return NextResponse.json({
      courses: courses.map(toDto),
      enrolled: Array.from(enrolledIds),
    });
  } catch (error) {
    console.error("my courses GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
