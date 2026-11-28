import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { PracticeSet } from "@/lib/models/practice-set";
import {
  canViewStudentSet,
  getPracticeAccess,
  toStudentSetDto,
} from "@/lib/practice/access";
import { serializePracticeSet } from "@/lib/practice/server";

function parseIndex(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
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

    const searchParams = request.nextUrl.searchParams;
    const moduleIndex = parseIndex(searchParams.get("moduleIndex"));
    const lessonIndex = parseIndex(searchParams.get("lessonIndex"));
    const skill = searchParams.get("skill")?.trim().toLowerCase() || "";

    const query: Record<string, unknown> = {
      course: course._id,
      status: "published",
    };
    if (moduleIndex !== null) query.moduleIndex = moduleIndex;
    if (lessonIndex !== null) query.lessonIndex = lessonIndex;
    if (skill) query.skill = skill;

    const docs = await PracticeSet.find(query).sort({ setNumber: 1 }).lean();
    const sets = docs
      .map((doc) => serializePracticeSet(doc))
      .filter((set) => canViewStudentSet(set, access, course))
      .map(toStudentSetDto);

    return NextResponse.json({ sets });
  } catch (error) {
    console.error("list student practice sets error", error);
    return NextResponse.json({ error: "Failed to load practice sets" }, { status: 500 });
  }
}
