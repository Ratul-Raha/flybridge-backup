import "server-only";

import { readObjectText } from "@/lib/s3";
import { PracticeSet, type PracticeSetDoc } from "@/lib/models/practice-set";
import {
  validatePracticeContent,
  type PracticeSetContent,
  type PracticeSetDto,
  type PracticeValidationReport,
} from "./schema";

function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in value) {
    return String((value as { toString(): string }).toString());
  }
  return "";
}

export function serializePracticeSet(doc: PracticeSetDoc): PracticeSetDto {
  return {
    id: idOf(doc._id),
    course: idOf(doc.course),
    courseSlug: doc.courseSlug ?? "",
    courseTitle: doc.courseTitle ?? "",
    category: doc.category ?? null,
    moduleIndex: doc.moduleIndex ?? 0,
    lessonIndex: typeof doc.lessonIndex === "number" ? doc.lessonIndex : null,
    skill: doc.skill ?? "general",
    setNumber: doc.setNumber ?? 0,
    title: doc.title ?? "",
    status: doc.status ?? "draft",
    fileName: doc.fileName ?? "",
    s3Key: doc.s3Key ?? "",
    questionCount: doc.questionCount ?? 0,
    passageCount: doc.passageCount ?? 0,
    typeCounts: (doc.typeCounts as Record<string, number>) ?? {},
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function loadPracticeSetContent(
  doc: PracticeSetDoc
): Promise<{ content: PracticeSetContent; report: PracticeValidationReport }> {
  const text = await readObjectText(doc.s3Key);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Stored question set is not valid JSON");
  }
  return validatePracticeContent(raw, doc.skill ?? "general");
}

export async function findPracticeSet(id: string) {
  return PracticeSet.findById(id);
}
