import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const attempt = await MockTestAttempt.findById(params.id)
      .populate("test", "title skill skill status")
      .lean();

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    if (attempt.user.toString() !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const test =
      (attempt as unknown as { test?: { _id?: { toString(): string }; title?: string; skill?: string } })
        .test ?? {};
    const result = (attempt.result ?? null) as {
      overallBand?: number;
      sections?: { key: string; title: string; band: number; comments: string }[];
      feedback?: string;
    } | null;

    const sections = Array.isArray(result?.sections)
      ? (result.sections as { key: string; title: string; band: number; comments: string }[])
      : [];

    return NextResponse.json({
      attempt: {
        id: attempt._id.toString(),
        testId: test._id?.toString() ?? "",
        title: test.title ?? "",
        skill: test.skill ?? "",
        status: attempt.status,
        startedAt: attempt.startedAt ?? null,
        submittedAt: attempt.submittedAt ?? null,
        timedOut: attempt.timedOut ?? false,
        answers: (attempt.answers ?? {}) as Record<string, { choice?: number; text?: string }>,
        result: result
          ? {
              overallBand: result.overallBand ?? 0,
              sections,
              feedback: result.feedback ?? "",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("mock-test attempt GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}