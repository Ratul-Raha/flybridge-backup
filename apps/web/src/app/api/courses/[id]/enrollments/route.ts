import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";

type PopulatedUser = {
  _id: unknown;
  name?: string;
  email?: string;
  avatar?: string | null;
  phone?: string | null;
  subscription?: string;
};

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

    const [enrollments, progressDocs] = await Promise.all([
      CourseEnrollment.find({ course: course._id })
        .sort({ createdAt: -1 })
        .populate("user", "name email avatar phone subscription"),
      CourseProgress.find({ course: course._id }).lean(),
    ]);

    const progressByUser = new Map(
      progressDocs.map((p) => [String(p.user), p])
    );

    const allLessons = (course.modules ?? []).flatMap(
      (m) => m.lessons ?? []
    );
    const totalLessons = allLessons.length;
    const watchableLessons = allLessons.filter((l) => l.videoUrl).length;
    const lessonDenominator = watchableLessons > 0 ? watchableLessons : totalLessons;

    const members = enrollments.map((e) => {
      const u = (e.user ?? null) as PopulatedUser | null;
      const userId = u?._id ? String(u._id) : "";
      const p = userId ? progressByUser.get(userId) : undefined;
      const quizAvg = p?.overallPercentage ?? 0;
      const lessonsCompleted = Math.min(p?.watchedLessons?.length ?? 0, lessonDenominator);
      const lessonProgress = lessonDenominator
        ? Math.round((lessonsCompleted / lessonDenominator) * 100)
        : 0;
      const completed = Boolean(p && (p.passed || quizAvg >= 100));
      return {
        id: e._id.toString(),
        userId,
        name: u?.name ?? "Unknown member",
        email: u?.email ?? "—",
        phone: u?.phone ?? null,
        avatar: u?.avatar ?? null,
        subscription: u?.subscription ?? "free",
        status: e.status ?? "active",
        enrolledAt: e.createdAt,
        lessonsCompleted,
        totalLessons,
        lessonProgress,
        quizAvg,
        passed: Boolean(p?.passed),
        certificateIssued: Boolean(p?.certificateIssued),
        completed,
      };
    });

    const total = members.length;
    const active = members.filter((m) => m.status === "active").length;
    const completedCount = members.filter((m) => m.completed).length;
    const certificates = members.filter((m) => m.certificateIssued).length;
    const avgLessonProgress = total
      ? Math.round(members.reduce((sum, m) => sum + m.lessonProgress, 0) / total)
      : 0;
    const avgQuizScore = total
      ? Math.round(members.reduce((sum, m) => sum + m.quizAvg, 0) / total)
      : 0;

    return NextResponse.json({
      course: {
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
        price: course.price ?? 0,
        currency: course.currency ?? "USD",
      },
      stats: {
        total,
        active,
        expired: total - active,
        completed: completedCount,
        certificates,
        avgLessonProgress,
        avgQuizScore,
      },
      members,
    });
  } catch (error) {
    console.error("course enrollments error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
