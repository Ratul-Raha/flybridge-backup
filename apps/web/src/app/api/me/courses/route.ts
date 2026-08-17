import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course, type CourseDoc } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { calculateGrade } from "@/lib/grading";

function toDto(c: CourseDoc, progress?: {
  overallPercentage: number;
  completedQuizzes: number;
  totalQuizzes: number;
  passed: boolean;
}) {
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
    progress: progress
      ? {
          percentage: progress.overallPercentage,
          completedQuizzes: progress.completedQuizzes,
          totalQuizzes: progress.totalQuizzes,
          passed: progress.passed,
        }
      : null,
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

    const enrolledCourses = courses.filter((c) => enrolledIds.has(c._id.toString()));

    const progressMap = new Map<string, {
      overallPercentage: number;
      completedQuizzes: number;
      totalQuizzes: number;
      passed: boolean;
    }>();

    if (enrolledCourses.length > 0) {
      const progresses = await CourseProgress.find({
        user: session.userId,
        course: { $in: enrolledCourses.map((c) => c._id) },
      }).lean();

      for (const p of progresses) {
        const totalLessons = (enrolledCourses
          .find((c) => c._id.toString() === p.course.toString())
          ?.modules ?? []
        ).reduce((n, m) => n + (m.lessons?.length ?? 0), 0);

        const grade = calculateGrade(
          p.quizScores as { score: number }[],
          totalLessons
        );

        progressMap.set(p.course.toString(), {
          overallPercentage: grade.percentage,
          completedQuizzes: grade.completedQuizzes,
          totalQuizzes: grade.totalQuizzes,
          passed: grade.passed,
        });
      }
    }

    return NextResponse.json({
      courses: courses.map((c) =>
        toDto(c, progressMap.get(c._id.toString()))
      ),
      enrolled: Array.from(enrolledIds),
    });
  } catch (error) {
    console.error("my courses GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
