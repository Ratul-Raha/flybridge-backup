import "server-only";

import { connectDb } from "@/lib/db";
import { MockTestEnrollment } from "@/lib/models/mock-test-enrollment";
import { CourseEnrollment } from "@/lib/models/enrollment";

export type MockTestOwnership = {
  bundles: Set<string>;
  courses: Set<string>;
};

export async function resolveMockTestOwnership(
  userId: string
): Promise<MockTestOwnership> {
  await connectDb();

  const [enrollments, courseEnrollments] = await Promise.all([
    // An expired enrollment is one a refund revoked — no access, no mocks.
    MockTestEnrollment.find({ user: userId, status: "active" }).select("bundle").lean(),
    CourseEnrollment.find({ user: userId, status: "active" }).select("course").lean(),
  ]);

  return {
    bundles: new Set(enrollments.map((e) => e.bundle.toString())),
    courses: new Set(courseEnrollments.map((e) => e.course.toString())),
  };
}

export function testIsOwned(
  ownership: MockTestOwnership,
  test: {
    bundle: { toString(): string } | string | null | undefined;
    course?: { toString(): string } | string | null;
  }
): boolean {
  if (!test.bundle) return false;
  const bundleId =
    typeof test.bundle === "string" ? test.bundle : test.bundle.toString();
  if (ownership.bundles.has(bundleId)) return true;
  if (!test.course) return false;
  const courseId =
    typeof test.course === "string" ? test.course : test.course.toString();
  return ownership.courses.has(courseId);
}

function multiLetterIndices(s: string): number[] | null {
  const normalized = s
    .replace(/\b(?:and|or)\b/gi, ",")
    .replace(/&/g, ",");
  const tokens = normalized.split(/[^A-Za-z]+/).filter(Boolean);
  if (tokens.length < 2) return null;
  const idxs: number[] = [];
  for (const t of tokens) {
    if (!/^[A-Za-z]$/.test(t)) return null;
    idxs.push(t.toUpperCase().charCodeAt(0) - 65);
  }
  return idxs.length > 1 ? idxs : null;
}

/**
 * Repairs choice-style questions whose answer key lists several letters
 * (e.g. "A, C") but were never flagged as multi-select. Without this the
 * player renders them as single-choice and students can only pick one option.
 */
export function normalizeMockTestAnswers(content: unknown): void {
  if (!content || typeof content !== "object") return;
  const sections = (content as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return;
  for (const s of sections) {
    const sec = s as { questions?: unknown } | null;
    if (!sec || !Array.isArray(sec.questions)) continue;
    for (const q of sec.questions) {
      const qu = q as {
        options?: unknown;
        answer?: unknown;
        multiple?: boolean;
        correctOptions?: number[];
        correctOption?: number;
      } | null;
      if (!qu || qu.multiple === true) continue;
      const opts = Array.isArray(qu.options) ? qu.options : [];
      if (opts.length < 2) continue;
      if (typeof qu.answer !== "string") continue;
      const multi = multiLetterIndices(qu.answer);
      if (multi && multi.every((i) => i < opts.length)) {
        qu.multiple = true;
        qu.correctOptions = Array.from(new Set(multi)).sort((a, b) => a - b);
        qu.correctOption = -1;
      }
    }
  }
}

export function countMockTestQuestions(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  const c = content as { sections?: unknown; passages?: unknown };
  const sections = Array.isArray(c.sections) ? c.sections : [];
  let count = sections.reduce(
    (n, s) =>
      n +
      (Array.isArray((s as { questions?: unknown }).questions)
        ? (s as { questions: unknown[] }).questions.length
        : 0),
    0
  );
  if (Array.isArray(c.passages)) {
    for (const p of c.passages) {
      if (!p || typeof p !== "object") continue;
      const pSections = (p as { sections?: unknown }).sections;
      if (!Array.isArray(pSections)) continue;
      count += pSections.reduce(
        (n, s) =>
          n +
          (Array.isArray((s as { questions?: unknown }).questions)
            ? (s as { questions: unknown[] }).questions.length
            : 0),
        0
      );
    }
  }
  return count;
}