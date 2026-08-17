import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { QuizAttempt } from "@/lib/models/quiz-attempt";
import type { QuizQuestion } from "@/lib/ai/quiz";

/* ------------------------------------------------------------------ */
/*  Short-answer grading helpers                                       */
/* ------------------------------------------------------------------ */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function keywords(s: string): Set<string> {
  const stop = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "between",
    "through", "during", "before", "after", "above", "below", "between",
    "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
    "neither", "each", "every", "all", "any", "few", "more", "most",
    "other", "some", "such", "no", "only", "own", "same", "than",
    "too", "very", "just", "because", "if", "when", "that", "this",
    "it", "its", "i", "me", "my", "we", "our", "you", "your", "they",
    "them", "their", "what", "which", "who", "whom",
  ]);
  const words = normalize(s)
    .split(" ")
    .filter((w) => w.length > 2 && !stop.has(w));
  return new Set(words);
}

function keywordOverlap(a: string, b: string): number {
  const ka = keywords(a);
  const kb = keywords(b);
  if (ka.size === 0 || kb.size === 0) return 0;
  let overlap = 0;
  for (const w of ka) {
    if (kb.has(w)) overlap++;
  }
  return overlap / Math.max(ka.size, kb.size);
}

function gradeShortAnswer(
  userAnswer: string,
  referenceAnswer: string
): boolean {
  const ua = normalize(userAnswer);
  const ra = normalize(referenceAnswer);

  if (!ua) return false;
  if (ua === ra) return true;
  if (ua.includes(ra) || ra.includes(ua)) return true;
  return keywordOverlap(ua, ra) >= 0.5;
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

type SubmittedAnswer = {
  questionId: string;
  answer: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { moduleIndex, lessonIndex, questions, answers } = body as {
      moduleIndex: number;
      lessonIndex: number;
      questions: QuizQuestion[];
      answers: SubmittedAnswer[];
    };

    if (
      typeof moduleIndex !== "number" ||
      typeof lessonIndex !== "number" ||
      !Array.isArray(questions) ||
      !Array.isArray(answers)
    ) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await connectDb();

    const course = await Course.findOne({
      _id: params.id,
      $or: [{ published: true }, { upcoming: true }],
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrolled = await CourseEnrollment.exists({
      user: session.userId,
      course: course._id,
      status: "active",
    });
    if (!enrolled) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const answerMap = new Map<string, string>();
    for (const a of answers) {
      answerMap.set(a.questionId, a.answer);
    }

    let correctCount = 0;
    const results = questions.map((q) => {
      const userAnswer = answerMap.get(q.id) ?? "";
      let correct = false;

      if (q.type === "mcq" || q.type === "true-false") {
        correct =
          normalize(userAnswer) === normalize(q.correctAnswer);
      } else {
        correct = gradeShortAnswer(userAnswer, q.correctAnswer);
      }

      if (correct) correctCount++;

      return {
        questionId: q.id,
        correct,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    await QuizAttempt.create({
      user: session.userId,
      course: course._id,
      courseSlug: course.slug,
      moduleIndex,
      lessonIndex,
      questions,
      answers: [...answerMap.entries()].map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
      score,
      totalQuestions,
      correctCount,
    });

    return NextResponse.json({ score, totalQuestions, correctCount, results });
  } catch (error) {
    console.error("quiz submit error", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
