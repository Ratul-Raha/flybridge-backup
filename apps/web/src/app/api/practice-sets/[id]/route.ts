import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { readObjectText } from "@/lib/s3";
import { PracticeSet, type PracticeSetDoc } from "@/lib/models/practice-set";
import { findPracticeSet, loadPracticeSetContent, serializePracticeSet } from "@/lib/practice/server";
import {
  PRACTICE_SET_STATUSES,
  validatePracticeContent,
  type PracticeSetStatus,
  type PracticeValidationReport,
} from "@/lib/practice/schema";

function isManager(session: { role: string } | null): boolean {
  return Boolean(session && (session.role === "admin" || session.role === "moderator"));
}

function isPracticeKey(key: string): boolean {
  return key.startsWith("private/practice/") || key.startsWith("public/practice/");
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid set id" }, { status: 400 });
  }
  try {
    await connectDb();
    const doc = await findPracticeSet(params.id);
    if (!doc) return NextResponse.json({ error: "Set not found" }, { status: 404 });
    const loaded = await loadPracticeSetContent(doc);
    return NextResponse.json({
      set: serializePracticeSet(doc),
      content: loaded.content,
      report: loaded.report,
    });
  } catch (error) {
    console.error("practice-set GET error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid set id" }, { status: 400 });
  }
  try {
    const body = await request.json();
    await connectDb();
    const doc = await findPracticeSet(params.id);
    if (!doc) return NextResponse.json({ error: "Set not found" }, { status: 404 });

    if (typeof body.title === "string" && body.title.trim()) doc.title = body.title.trim();
    if (typeof body.status === "string") {
      if (!(PRACTICE_SET_STATUSES as readonly string[]).includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      doc.status = body.status as PracticeSetStatus;
    }
    if (typeof body.fileName === "string") doc.fileName = body.fileName.trim();

    let report: PracticeValidationReport | undefined;
    if (typeof body.s3Key === "string" && body.s3Key.trim()) {
      const s3Key = body.s3Key.trim();
      if (!isPracticeKey(s3Key)) {
        return NextResponse.json({ error: "Invalid question bank file" }, { status: 400 });
      }
      const text = await readObjectText(s3Key);
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: "Uploaded file is not valid JSON" }, { status: 400 });
      }
      const validated = validatePracticeContent(raw, doc.skill ?? "general");
      if (validated.report.errors.length > 0) {
        return NextResponse.json(
          { error: "Question set has validation errors", report: validated.report },
          { status: 400 }
        );
      }
      doc.s3Key = s3Key;
      doc.s3Ref = `s3://${s3Key}`;
      doc.questionCount = validated.report.questionCount;
      doc.passageCount = validated.report.passageCount;
      doc.typeCounts = validated.report.typeCounts;
      report = validated.report;
    }

    await doc.save();
    return NextResponse.json({
      set: serializePracticeSet(doc as unknown as PracticeSetDoc),
      ...(report ? { report } : {}),
    });
  } catch (error) {
    console.error("practice-set PATCH error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid set id" }, { status: 400 });
  }
  try {
    await connectDb();
    const deleted = await PracticeSet.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: "Set not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("practice-set DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
