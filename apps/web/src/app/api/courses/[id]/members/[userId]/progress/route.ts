import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (!Types.ObjectId.isValid(params.userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    await connectDb();
    const key = params.id;
    const isObjectId = Types.ObjectId.isValid(key);
    const course = await Course.findOne(
      isObjectId ? { _id: key } : { slug: key.toLowerCase() }
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrollment = await CourseEnrollment.findOne({
      course: course._id,
      user: params.userId,
    }).populate("user", "name email avatar phone subscription");

    if (!enrollment) {
      return NextResponse.json(
        { error: "User is not enrolled in this course" },
        { status: 404 }
      );
    }

    const progress = await CourseProgress.findOne({
      course: course._id,
      user: params.userId,
    }).lean();

    const user = (enrollment.user ?? null) as {
      _id: unknown;
      name?: string;
      email?: string;
      avatar?: string | null;
      phone?: string | null;
      subscription?: string;
    } | null;

    const scores = (progress?.quizScores ?? []) as {
      moduleIndex: number;
      lessonIndex: number;
      score: number;
      totalQuestions: number;
      correctCount: number;
      attempts: number;
    }[];

    const scoreMap = new Map(
      scores.map((s) => [`${s.moduleIndex}:${s.lessonIndex}`, s])
    );

    const modules = (course.modules ?? []).map((mod, moduleIndex) => ({
      title: mod.title,
      lessons: (mod.lessons ?? []).map((lesson, lessonIndex) => {
        const entry = scoreMap.get(`${moduleIndex}:${lessonIndex}`);
        const completed = Boolean(entry && entry.score >= 60);
        return {
          title: lesson.title,
          duration: lesson.duration ?? "",
          moduleIndex,
          lessonIndex,
          completed,
          attempted: Boolean(entry),
          score: entry?.score ?? null,
          totalQuestions: entry?.totalQuestions ?? 0,
          correctCount: entry?.correctCount ?? 0,
          attempts: entry?.attempts ?? 0,
        };
      }),
    }));

    const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
    const completedLessons = modules.reduce(
      (n, m) => n + m.lessons.filter((l) => l.completed).length,
      0
    );

    return NextResponse.json({
      user: {
        id: user?._id ? String(user._id) : params.userId,
        name: user?.name ?? "Unknown member",
        email: user?.email ?? "—",
        avatar: user?.avatar ?? null,
        phone: user?.phone ?? null,
        subscription: user?.subscription ?? "free",
      },
      course: {
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
      },
      summary: {
        totalLessons,
        completedLessons,
        lessonProgress: totalLessons
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
        quizAvg: progress?.overallPercentage ?? 0,
        passed: Boolean(progress?.passed),
        totalQuizzes: progress?.totalQuizzes ?? 0,
        completedQuizzes: progress?.completedQuizzes ?? 0,
      },
      modules,
    });
  } catch (error) {
    console.error("course member progress error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
