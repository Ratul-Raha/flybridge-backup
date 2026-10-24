import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { QuizPending } from "@/lib/models/quiz-pending";
import { generateQuiz, resolveLessonSkill } from "@/lib/ai/quiz";

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
    const { moduleIndex, lessonIndex, provider } = body as {
      moduleIndex: number;
      lessonIndex: number;
      provider?: unknown;
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

    if (lesson.quiz === false) {
      return NextResponse.json(
        { error: "Quiz is not enabled for this lesson" },
        { status: 400 }
      );
    }

    const questions = await generateQuiz(
      course.title,
      mod.title,
      lesson.title,
      {
        category: course.category ?? null,
        skill: resolveLessonSkill(lesson.skill, lesson.topics),
        slug: course.slug,
        lessonContent: lesson.content ?? "",
        provider: typeof provider === "string" ? provider : undefined,
        topics: {
          description: lesson.topics?.description ?? "",
          items: (lesson.topics?.items ?? []).map((t) => ({
            skill: t.skill,
            text: t.text,
          })),
        },
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

    return NextResponse.json({ quizId: pending._id.toString(), questions });
  } catch (error) {
    console.error("quiz generate error", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate quiz", detail },
      { status: 500 }
    );
  }
}
