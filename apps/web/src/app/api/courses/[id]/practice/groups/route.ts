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
import { loadPracticeSetContent, serializePracticeSet } from "@/lib/practice/server";
import { stripPracticeAnswers, type PracticeQuestion } from "@/lib/practice/schema";

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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

  const skill = request.nextUrl.searchParams.get("skill")?.trim().toLowerCase() ?? "";
  const type = request.nextUrl.searchParams.get("type")?.trim().toLowerCase() ?? "";
  if (!skill || !type) {
    return NextResponse.json({ error: "Skill and question type are required" }, { status: 400 });
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

    const docs = await PracticeSet.find({
      course: course._id,
      status: "published",
      skill,
    })
      .lean();

    const eligible = shuffled(
      docs.filter((doc) => (doc.typeCounts?.[type] ?? 0) > 0)
    ).filter((doc) => canViewStudentSet(serializePracticeSet(doc), access, course));

    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this type yet" },
        { status: 404 }
      );
    }

    const needsPassage = skill === "reading" || skill === "listening";

    for (const doc of eligible) {
      const { content } = await loadPracticeSetContent(doc);
      const matching = content.questions.filter((question) => question.type === type);
      if (matching.length === 0) continue;

      const groups = new Map<string, PracticeQuestion[]>();
      if (needsPassage) {
        for (const question of matching) {
          const key = question.passageId?.trim();
          if (!key) continue;
          groups.set(key, [...(groups.get(key) ?? []), question]);
        }
      } else {
        groups.set("", matching);
      }

      const candidates = Array.from(groups.entries()).filter(([key, questions]) => {
        if (!needsPassage) return questions.length > 0;
        return Boolean(key && content.passages?.some((passage) => passage.id === key));
      });
      if (candidates.length === 0) continue;

      const [groupKey, groupQuestions] = shuffled(candidates)[0];
      const audios =
        skill === "listening" && groupKey && content.audios?.[groupKey]
          ? { [groupKey]: content.audios[groupKey] }
          : content.audios;

      return NextResponse.json({
        set: toStudentSetDto(serializePracticeSet(doc)),
        content: stripPracticeAnswers({
          ...content,
          passages: needsPassage
            ? (content.passages ?? []).filter((passage) => passage.id === groupKey)
            : [],
          ...(audios ? { audios } : {}),
          questions: groupQuestions,
        }),
      });
    }

    return NextResponse.json(
      { error: "No questions found for this type yet" },
      { status: 404 }
    );
  } catch (error) {
    console.error("load random practice group error", error);
    return NextResponse.json({ error: "Failed to load practice questions" }, { status: 500 });
  }
}
