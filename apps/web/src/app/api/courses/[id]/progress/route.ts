import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { calculateGrade } from "@/lib/grading";

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
      progress = await CourseProgress.create({
        user: session.userId,
        course: course._id,
        courseSlug: course.slug,
        watchedLessons: [],
        quizScores: [],
        overallPercentage: 0,
        totalQuizzes: totalLessons,
        completedQuizzes: 0,
        passed: false,
      });
    }

    const grade = calculateGrade(
      progress.quizScores as { score: number }[],
      totalLessons
    );

    return NextResponse.json({
      watchedLessons: progress.watchedLessons,
      quizScores: progress.quizScores,
      grade,
      certificateIssued: progress.certificateIssued,
    });
  } catch (error) {
    console.error("progress GET error", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { watchedLesson } = body as { watchedLesson?: number };

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

    const update: Record<string, unknown> = {};

    if (typeof watchedLesson === "number") {
      update.$addToSet = { watchedLessons: watchedLesson };
    }

    const progress = await CourseProgress.findOneAndUpdate(
      { user: session.userId, course: course._id },
      {
        $setOnInsert: {
          user: session.userId,
          course: course._id,
          courseSlug: course.slug,
          totalQuizzes: totalLessons,
        },
        ...update,
      },
      { upsert: true, new: true }
    );

    const grade = calculateGrade(
      progress.quizScores as { score: number }[],
      totalLessons
    );

    return NextResponse.json({
      watchedLessons: progress.watchedLessons,
      quizScores: progress.quizScores,
      grade,
      certificateIssued: progress.certificateIssued,
    });
  } catch (error) {
    console.error("progress PUT error", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
