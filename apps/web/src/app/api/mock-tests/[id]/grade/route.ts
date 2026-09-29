import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest } from "@/lib/models/mock-test";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";
import { judgeMockTestAttempt } from "@/lib/ai/ielts-judge";
import { resolveMockTestOwnership, testIsOwned } from "@/lib/mock-tests";
import { recordBundleMockSubmission } from "@/lib/refunds";
import { emitEvent } from "@/lib/events/emit";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const manager = isManager(session);
  const userId = session.userId;
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const test = await MockTest.findById(params.id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    if (!manager) {
      if (test.status !== "published") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const ownership = await resolveMockTestOwnership(userId);
      if (!testIsOwned(ownership, test)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
    const attempt = attemptId
      ? await MockTestAttempt.findById(attemptId)
      : null;
    if (attempt && attempt.user.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const answers: Record<string, { choice?: number; text?: string } | undefined> =
      body.answers && typeof body.answers === "object" ? body.answers : {};

    const result = await judgeMockTestAttempt({
      skill: test.skill,
      title: test.title,
      content: {
        passage: test.content?.passage,
        passages: (test.content?.passages ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          text: p.text,
        })),
        writingTask1: test.content?.writingTask1,
        writingTask2: test.content?.writingTask2,
      },
      sections: (test.content?.sections ?? []).map((s) => ({
        id: s.id,
        type: s.type,
        passageId: s.passageId,
        questions: (s.questions ?? []).map((q) => ({
          qid: q.qid,
          prompt: q.prompt,
          options: q.options,
          correctOption: q.correctOption ?? -1,
          answer: q.answer ?? "",
        })),
      })),
      answerKey: test.answerKey ?? "",
      answers,
    });

    const finished =
      attempt ??
      (await MockTestAttempt.create({
        user: userId,
        test: test._id,
        bundle: test.bundle,
        status: "in_progress",
        startedAt: new Date(),
      }));

    /**
     * A bundle holder forfeits their 3-day refund by submitting a sitting, so
     * the stamp has to happen here — on submit, not on open. Course holders are
     * counted when they start a sitting, which `recordMockTestPlay` already did.
     */
    if (test.bundle) {
      await recordBundleMockSubmission({
        userId,
        bundleId: test.bundle.toString(),
      });
    }

    finished.answers = answers;
    finished.result = result;
    finished.status = "graded";
    finished.submittedAt = new Date();
    finished.timedOut = body.timedOut === true;
    await finished.save();

    await emitEvent("mock-test.submitted", {
      attemptId: finished._id.toString(),
      user: {
        id: userId,
        name: session.name,
        email: session.email,
      },
      test: { id: test._id.toString(), title: test.title, skill: test.skill },
    });

    return NextResponse.json({
      ok: true,
      attempt: {
        id: finished._id.toString(),
        status: finished.status,
        submittedAt: finished.submittedAt,
      },
      result,
    });
  } catch (error) {
    console.error("mock-test grade POST error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message.includes("JSON") ? "Grading failed. Please try again." : message },
      { status: 500 }
    );
  }
}