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
    if (!enrolled) {
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

    if (!progress) {
      return NextResponse.json(
        { error: "Course not completed", eligible: false },
        { status: 403 }
      );
    }

    const grade = calculateGrade(
      progress.quizScores as { score: number }[],
      totalLessons
    );

    const eligible =
      grade.passed && grade.completedQuizzes === grade.totalQuizzes;

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

    if (!progress.certificateIssued) {
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
