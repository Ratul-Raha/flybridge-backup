import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import {
  canViewStudentSet,
  getPracticeAccess,
  toStudentSetDto,
} from "@/lib/practice/access";
import {
  findPracticeSet,
  loadPracticeSetContent,
  serializePracticeSet,
} from "@/lib/practice/server";
import { stripPracticeAnswers } from "@/lib/practice/schema";

export async function GET(
  _request: Request,
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

    const { content } = await loadPracticeSetContent(set);
    return NextResponse.json({
      set: toStudentSetDto(dto),
      content: stripPracticeAnswers(content),
    });
  } catch (error) {
    console.error("load student practice set error", error);
    return NextResponse.json({ error: "Failed to load practice set" }, { status: 500 });
  }
}
