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

  // Staff (admin/moderator) may access the route at any time (to verify or
  // preview), but are still subject to the same completion gate as everyone
  // else — a certificate is only issued after all quizzes are taken at >=60%.
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

  // Staff (admin/moderator) may access the route (to verify/preview) but are
  // still subject to the same completion gate as everyone else.
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
        { error: "Course not completed", eligible: false },
        { status: 403 }
      );
    }

    progress.certificateIssued = true;
    progress.certificateDownloadedAt = new Date();
    progress.certificateDownloadCount =
      (progress.certificateDownloadCount ?? 0) + 1;
    await progress.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("certificate download tracking error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
