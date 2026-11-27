import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { PracticeSet, type PracticeSetDoc } from "@/lib/models/practice-set";
import { readObjectText } from "@/lib/s3";
import { serializePracticeSet } from "@/lib/practice/server";
import { validatePracticeContent, type PracticeValidationReport } from "@/lib/practice/schema";

function isManager(session: { role: string } | null): boolean {
  return Boolean(session && (session.role === "admin" || session.role === "moderator"));
}

function isPracticeKey(key: string): boolean {
  return key.startsWith("private/practice/") || key.startsWith("public/practice/");
}

function parseOptionalIndex(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : -1;
}

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const moduleIndex = parseOptionalIndex(searchParams.get("moduleIndex"));
    const lessonParam = searchParams.get("lessonIndex");
    const lessonIndex =
      lessonParam === null ? null : lessonParam === "none" ? null : parseOptionalIndex(lessonParam);
    const skill = searchParams.get("skill");

    const filter: Record<string, unknown> = {};
    if (course && mongoose.isValidObjectId(course)) filter.course = new mongoose.Types.ObjectId(course);
    if (typeof moduleIndex === "number" && moduleIndex >= 0) filter.moduleIndex = moduleIndex;
    if (lessonParam !== null && typeof lessonIndex === "number") {
      filter.lessonIndex = lessonIndex;
    } else if (lessonParam === "none") {
      filter.lessonIndex = null;
    }
    if (skill) filter.skill = skill;

    const docs = await PracticeSet.find(filter).sort({ setNumber: 1, createdAt: 1 });
    return NextResponse.json({
      sets: docs.map((doc) => serializePracticeSet(doc as unknown as PracticeSetDoc)),
    });
  } catch (error) {
    console.error("practice-sets GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    if (!mongoose.isValidObjectId(courseId)) {
      return NextResponse.json({ error: "A valid course is required" }, { status: 400 });
    }

    const moduleIndex = parseOptionalIndex(body.moduleIndex);
    const lessonIndex = parseOptionalIndex(body.lessonIndex);
    const s3Key = typeof body.s3Key === "string" ? body.s3Key.trim() : "";
    if (moduleIndex === null || moduleIndex < 0) {
      return NextResponse.json({ error: "Invalid module index" }, { status: 400 });
    }
    if (lessonIndex !== null && lessonIndex < 0) {
      return NextResponse.json({ error: "Invalid lesson index" }, { status: 400 });
    }
    if (!isPracticeKey(s3Key)) {
      return NextResponse.json({ error: "Invalid question bank file" }, { status: 400 });
    }

    await connectDb();
    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const module = course.modules?.[moduleIndex];
    if (!module) {
      return NextResponse.json({ error: "Course module not found" }, { status: 404 });
    }
    let lesson = null;
    if (typeof lessonIndex === "number") {
      lesson = module.lessons?.[lessonIndex] ?? null;
      if (!lesson) {
        return NextResponse.json({ error: "Course lesson not found" }, { status: 404 });
      }
    }

    const skill =
      (typeof body.skill === "string" && body.skill.trim()) ||
      (lesson ? lesson.skill || "general" : "general");

    const text = await readObjectText(s3Key);
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Uploaded file is not valid JSON" }, { status: 400 });
    }

    let validated: ReturnType<typeof validatePracticeContent>;
    try {
      validated = validatePracticeContent(raw, skill);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid question set" },
        { status: 400 }
      );
    }
    if (validated.report.errors.length > 0) {
      return NextResponse.json(
        { error: "Question set has validation errors", report: validated.report },
        { status: 400 }
      );
    }

    const last = await PracticeSet.findOne({
      course: course._id,
      moduleIndex,
      lessonIndex,
      skill,
    })
      .sort({ setNumber: -1 })
      .select("setNumber");
    const setNumber = (last?.setNumber ?? 0) + 1;

    const doc = await PracticeSet.create({
      course: course._id,
      courseSlug: course.slug,
      courseTitle: course.title,
      category: course.category ?? null,
      moduleIndex,
      lessonIndex,
      skill,
      setNumber,
      title:
        (typeof body.title === "string" && body.title.trim()) ||
        `${module.title || `Module ${moduleIndex + 1}`} — Set ${setNumber}`,
      status: "draft",
      s3Key,
      s3Ref: `s3://${s3Key}`,
      fileName: typeof body.fileName === "string" ? body.fileName.trim() : "",
      questionCount: validated.report.questionCount,
      passageCount: validated.report.passageCount,
      typeCounts: validated.report.typeCounts,
      createdBy: session?.userId,
    });

    return NextResponse.json(
      {
        set: serializePracticeSet(doc as unknown as PracticeSetDoc),
        report: validated.report satisfies PracticeValidationReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("practice-sets POST error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
