import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course, type CourseDoc } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { calculateGrade } from "@/lib/grading";
import { cleanPrices, formatMoney } from "@/lib/pricing";
import { resolveCoursePrice, serializeCourseDiscount } from "@/lib/course-discount";

function toDto(c: CourseDoc, progress?: {
  overallPercentage: number;
  completedQuizzes: number;
  totalQuizzes: number;
  passed: boolean;
}) {
  const prices = cleanPrices(c.prices);
  const base = prices.BDT;
  const resolved =
    typeof base === "number" && base > 0
      ? resolveCoursePrice(base, c.discount)
      : null;
  const running = resolved?.originalPrice ?? null;
  const discount = serializeCourseDiscount(c.discount);

  return {
    id: c._id.toString(),
    slug: c.slug,
    title: c.title,
    badge: c.badge ?? "",
    subtitle: c.subtitle ?? "",
    description: c.description ?? "",
    price: c.price ?? 0,
    currency: c.currency ?? "USD",
    prices: running === null ? prices : { ...prices, BDT: resolved!.price },
    discount,
    discountLabel: running === null ? null : resolved!.label,
    originalPrice: running === null ? null : formatMoney(running, "BDT"),
    discountEndsAt: running === null ? null : discount.endsAt,
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
    const enrollCounts = await CourseEnrollment.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    const enrollMap = new Map(enrollCounts.map((r) => [r._id.toString(), r.count as number]));
    courses.sort((a, b) => (enrollMap.get(b._id.toString()) ?? 0) - (enrollMap.get(a._id.toString()) ?? 0));

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
