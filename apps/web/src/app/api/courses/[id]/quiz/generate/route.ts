import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { QuizPending } from "@/lib/models/quiz-pending";
import { generateQuiz, detectIeltsFocus } from "@/lib/ai/quiz";
import { COURSE_CATEGORIES } from "@/lib/course-categories";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isStaff = session.role === "admin" || session.role === "moderator";

    const body = await request.json();
    const { moduleIndex, lessonIndex } = body as {
      moduleIndex: number;
      lessonIndex: number;
    };

    if (typeof moduleIndex !== "number" || typeof lessonIndex !== "number") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await connectDb();

    const course = await Course.findOne({
      _id: params.id,
      ...(isStaff ? {} : { $or: [{ published: true }, { upcoming: true }] }),
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!isStaff) {
      const enrolled = await CourseEnrollment.exists({
        user: session.userId,
        course: course._id,
        status: "active",
      });
      if (!enrolled) {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
      }
    }

    const mod = course.modules?.[moduleIndex];
    if (!mod) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const lesson = mod.lessons?.[lessonIndex];
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const mode = course.category === COURSE_CATEGORIES[0] ? "ielts" : "general";
    const ieltsFocus =
      mode === "ielts" ? detectIeltsFocus(mod.title, lesson.title) : null;
    console.log("[quiz] generate", {
      course: course.title,
      category: course.category ?? null,
      lesson: lesson.title,
      module: mod.title,
      lessonContentLength: (lesson.content ?? "").length,
      mode,
      ieltsSkill: ieltsFocus?.skill ?? null,
    });

    const questions = await generateQuiz(
      course.title,
      mod.title,
      lesson.title,
      {
        category: course.category ?? null,
        lessonContent: lesson.content ?? "",
      }
    );

    await QuizPending.deleteMany({
      user: session.userId,
      course: course._id,
      moduleIndex,
      lessonIndex,
    });

    const pending = await QuizPending.create({
      user: session.userId,
      course: course._id,
      moduleIndex,
      lessonIndex,
      questions,
    });

    return NextResponse.json({
      quizId: pending._id.toString(),
      mode,
      ieltsSkill: ieltsFocus?.skill ?? null,
      questions,
    });
  } catch (error) {
    console.error("quiz generate error", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate quiz", detail },
      { status: 500 }
    );
  }
}
