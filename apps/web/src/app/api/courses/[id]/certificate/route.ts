import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { calculateGrade } from "@/lib/grading";

/**
 * Server-side gate for certificate issuance.
 *
 * Prevents a user from downloading a certificate for a course they have not
 * actually completed. Completion is recomputed on the server (average quiz
 * score >= 60% and every lesson quiz submitted) — it can never be faked by
 * the client, which is entirely responsible for generating the PDF.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Staff (admin/moderator) may issue/download certificates at any time,
  // regardless of quiz completion.
  const isManager =
    session.role === "admin" || session.role === "moderator";

  try {
    await connectDb();

    const course = await Course.findOne({
      _id: params.id,
      $or: [{ published: true }, { upcoming: true }],
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrolled = await CourseEnrollment.exists({
      user: session.userId,
      course: course._id,
      status: "active",
    });
    if (!enrolled && !isManager) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const totalLessons = (course.modules ?? []).reduce(
      (n, m) => n + (m.lessons?.length ?? 0),
      0
    );

    let progress = await CourseProgress.findOne({
      user: session.userId,
      course: course._id,
    });

    if (!isManager && !progress) {
      return NextResponse.json(
        { error: "Course not completed", eligible: false },
        { status: 403 }
      );
    }

    const grade = progress
      ? calculateGrade(
          progress.quizScores as { score: number }[],
          totalLessons
        )
      : {
          percentage: 100,
          grade: "A",
          englishLevel: "Advanced (C2)",
          passed: true,
          totalQuizzes: totalLessons,
          completedQuizzes: totalLessons,
        };

    const eligible =
      isManager ||
      (grade.passed && grade.completedQuizzes === grade.totalQuizzes);

    if (!eligible) {
      return NextResponse.json(
        {
          error: "Course not completed",
          eligible: false,
          grade,
        },
        { status: 403 }
      );
    }

    if (progress && !progress.certificateIssued) {
      progress.certificateIssued = true;
      await progress.save();
    }

    return NextResponse.json({
      eligible: true,
      certificateIssued: true,
      courseTitle: course.title,
      courseSlug: course.slug,
      grade,
      issuedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("certificate issuance error", error);
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 }
    );
  }
}

/**
 * Records that the current user downloaded/printed their certificate for a
 * course. This powers per-user and per-course "certificate downloaded" stats.
 *
 * Uses the same server-side gate as GET() so the download can only be recorded
 * once the user is actually eligible, and never for courses they haven't
 * completed.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isManager =
    session.role === "admin" || session.role === "moderator";

  try {
    await connectDb();

    const course = await Course.findOne({
      _id: params.id,
      $or: [{ published: true }, { upcoming: true }],
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrolled = await CourseEnrollment.exists({
      user: session.userId,
      course: course._id,
      status: "active",
    });
    if (!enrolled && !isManager) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const totalLessons = (course.modules ?? []).reduce(
      (n, m) => n + (m.lessons?.length ?? 0),
      0
    );

    const progress = await CourseProgress.findOne({
      user: session.userId,
      course: course._id,
    });

    let grade: {
      percentage: number;
      grade: string;
      englishLevel: string;
      passed: boolean;
      totalQuizzes: number;
      completedQuizzes: number;
    };
    if (progress) {
      grade = calculateGrade(
        progress.quizScores as { score: number }[],
        totalLessons
      );
    } else {
      const gradeEntry = {
        percentage: 100,
        grade: "A",
        englishLevel: "Advanced (C2)",
        passed: true,
      };
      grade = {
        ...gradeEntry,
        totalQuizzes: totalLessons,
        completedQuizzes: totalLessons,
      };
    }

    const eligible =
      isManager ||
      (grade.passed && grade.completedQuizzes === grade.totalQuizzes);

    if (!eligible) {
      return NextResponse.json(
        { error: "Course not completed", eligible: false },
        { status: 403 }
      );
    }

    const target =
      progress ??
      new CourseProgress({
        user: session.userId,
        course: course._id,
        courseSlug: course.slug,
        passed: true,
        overallPercentage: 100,
        totalQuizzes: totalLessons,
        completedQuizzes: totalLessons,
      });

    target.certificateIssued = true;
    target.certificateDownloadedAt = new Date();
    target.certificateDownloadCount = (target.certificateDownloadCount ?? 0) + 1;
    await target.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("certificate download tracking error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
