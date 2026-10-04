import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { QuizAttempt } from "@/lib/models/quiz-attempt";
import { QuizPending } from "@/lib/models/quiz-pending";
import { CourseProgress } from "@/lib/models/course-progress";
import { isSubjectiveLesson, resolveLessonSkill, type QuizQuestion } from "@/lib/ai/quiz";
import { judgeObjectiveAnswers, judgeWrittenAnswers } from "@/lib/ai/quiz-judge";
import { COURSE_CATEGORIES } from "@/lib/course-categories";
import { emitEvent } from "@/lib/events/emit";

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
    const isStaff = session.role === "admin" || session.role === "moderator";

    const body = await request.json();
    const { moduleIndex, lessonIndex, quizId, answers } = body as {
      moduleIndex: number;
      lessonIndex: number;
      quizId: string;
      answers: SubmittedAnswer[];
    };

    if (
      typeof moduleIndex !== "number" ||
      typeof lessonIndex !== "number" ||
      typeof quizId !== "string" ||
      !mongoose.isValidObjectId(quizId) ||
      !Array.isArray(answers)
    ) {
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

    const pending = await QuizPending.findOne({
      _id: quizId,
      user: session.userId,
      course: course._id,
    });
    if (!pending) {
      return NextResponse.json(
        { error: "Quiz session not found. Please generate a new quiz." },
        { status: 400 }
      );
    }
    if (
      pending.moduleIndex !== moduleIndex ||
      pending.lessonIndex !== lessonIndex
    ) {
      return NextResponse.json(
        { error: "Quiz session does not match lesson" },
        { status: 400 }
      );
    }

    const questions = pending.questions as QuizQuestion[];

    const answerMap = new Map<string, string>();
    for (const a of answers) {
      answerMap.set(a.questionId, a.answer);
    }

    const isIelts = course.category === COURSE_CATEGORIES[0];
    const lesson = course.modules?.[moduleIndex]?.lessons?.[lessonIndex];
    const lessonSkill = resolveLessonSkill(lesson?.skill, lesson?.topics);

    // Speaking/writing IELTS lessons are graded by the AI judge and never saved.
    if (isSubjectiveLesson(course.category, lessonSkill)) {
      await QuizPending.deleteOne({ _id: pending._id });
      const results = await judgeWrittenAnswers(
        questions,
        Object.fromEntries(answerMap.entries()),
        lessonSkill
      );
      const bands = results.map((r) => r.bandScore).filter((b) => b > 0);
      const overallBand =
        bands.length > 0
          ? Math.round((bands.reduce((sum, b) => sum + b, 0) / bands.length) * 2) / 2
          : 0;
      return NextResponse.json({ mode: "subjective", overallBand, results });
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
        band7Answer: "",
        comparison: "",
      };
    });

    // IELTS reading/listening: enrich objective grading with an AI explanation and
    // a comparison against a band 7 answer. Failure here never blocks the result.
    if (isIelts) {
      try {
        const feedback = await judgeObjectiveAnswers(
          questions,
          Object.fromEntries(answerMap.entries()),
          lessonSkill
        );
        const feedbackMap = new Map(feedback.map((f) => [f.questionId, f]));
        for (const r of results) {
          const f = feedbackMap.get(r.questionId);
          if (!f) continue;
          r.explanation = f.explanation || r.explanation;
          r.band7Answer = f.band7Answer;
          r.comparison = f.comparison;
        }
      } catch (error) {
        console.error("objective judge error", error);
      }
    }

    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    await QuizPending.deleteOne({ _id: pending._id });

    // IELTS practice is not tracked: submit -> instant feedback, nothing saved.
    if (!isIelts) {
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

      // Update CourseProgress with quiz score (replace on retake)
      const totalLessons = (course.modules ?? []).reduce(
        (n, m) => n + (m.lessons?.length ?? 0),
        0
      );

      const existingProgress = await CourseProgress.findOne({
        user: session.userId,
        course: course._id,
      });

      let quizScores = (existingProgress?.quizScores as {
        moduleIndex: number;
        lessonIndex: number;
        score: number;
        totalQuestions: number;
        correctCount: number;
        attempts: number;
      }[]) ?? [];

      const existingIdx = quizScores.findIndex(
        (s) => s.moduleIndex === moduleIndex && s.lessonIndex === lessonIndex
      );

      if (existingIdx >= 0) {
        quizScores[existingIdx] = {
          moduleIndex,
          lessonIndex,
          score,
          totalQuestions,
          correctCount,
          attempts: (quizScores[existingIdx].attempts ?? 1) + 1,
        };
      } else {
        quizScores.push({
          moduleIndex,
          lessonIndex,
          score,
          totalQuestions,
          correctCount,
          attempts: 1,
        });
      }

      const avgScore =
        quizScores.length > 0
          ? Math.round(
              quizScores.reduce((sum, q) => sum + q.score, 0) /
                quizScores.length
            )
          : 0;

      const passed = avgScore >= 60 && quizScores.length === totalLessons;

      await CourseProgress.findOneAndUpdate(
        { user: session.userId, course: course._id },
        {
          $setOnInsert: {
            user: session.userId,
            course: course._id,
            courseSlug: course.slug,
            totalQuizzes: totalLessons,
          },
          $set: {
            quizScores,
            overallPercentage: avgScore,
            completedQuizzes: quizScores.length,
            passed,
          },
        },
        { upsert: true }
      );

      void emitEvent(
        "course.progress_updated",
        {
          user: {
            id: session.userId,
            name: session.name,
            email: session.email,
          },
          course: {
            id: course._id.toString(),
            slug: course.slug,
            title: course.title,
          },
          progress: {
            overallPercentage: avgScore,
            passed,
            certificateIssued: false,
          },
        }
      ).catch((error) => {
        console.error("course.progress_updated emit error", error);
      });
    }

    return NextResponse.json({
      mode: "objective",
      score,
      totalQuestions,
      correctCount,
      results,
    });
  } catch (error) {
    console.error("quiz submit error", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
