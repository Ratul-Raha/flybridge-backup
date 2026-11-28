import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import {
  canViewStudentSet,
  getPracticeAccess,
} from "@/lib/practice/access";
import { gradePracticeSet } from "@/lib/practice/grading";
import {
  findPracticeSet,
  loadPracticeSetContent,
  serializePracticeSet,
} from "@/lib/practice/server";

type SubmittedAnswer = { questionId: string; answer: string };

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; setId: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    !mongoose.isValidObjectId(params.id) ||
    !mongoose.isValidObjectId(params.setId)
  ) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDb();

    const course = await Course.findOne({ _id: params.id, published: true });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const access = await getPracticeAccess(
      { userId: session.userId, role: session.role },
      course
    );
    const set = await findPracticeSet(params.setId);
    if (
      !set ||
      set.course?.toString() !== course._id.toString() ||
      (set.status !== "published" && !access.isStaff)
    ) {
      return NextResponse.json({ error: "Practice set not found" }, { status: 404 });
    }

    const dto = serializePracticeSet(set);
    if (!canViewStudentSet(dto, access, course)) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const body = (await request.json()) as {
      answers?: unknown;
      provider?: unknown;
    };
    if (!Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Answers must be an array" }, { status: 400 });
    }

    const answers: SubmittedAnswer[] = body.answers
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        questionId: typeof entry.questionId === "string" ? entry.questionId : "",
        answer: typeof entry.answer === "string" ? entry.answer : "",
      }))
      .filter((entry) => entry.questionId);

    const { content } = await loadPracticeSetContent(set);
    const provider = typeof body.provider === "string" ? body.provider : undefined;
    const grade = await gradePracticeSet(content, dto.skill, answers, provider);

    return NextResponse.json(grade);
  } catch (error) {
    console.error("submit practice set error", error);
    return NextResponse.json({ error: "Failed to grade practice set" }, { status: 500 });
  }
}
