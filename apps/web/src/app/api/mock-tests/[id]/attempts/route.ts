import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest } from "@/lib/models/mock-test";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";
import { resolveMockTestOwnership, testIsOwned } from "@/lib/mock-tests";
import { recordMockTestPlay } from "@/lib/refunds";

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

    const existing = await MockTestAttempt.findOne({
      user: userId,
      test: test._id,
      status: "in_progress",
    });

    // Only a genuinely new sitting is counted, so resuming after a refresh does
    // not burn the student's single refund-safe mock exam.
    let attempt = existing;
    if (!attempt) {
      attempt = await MockTestAttempt.create({
        user: userId,
        test: test._id,
        bundle: test.bundle,
        status: "in_progress",
        startedAt: new Date(),
      });

      if (test.course) {
        await recordMockTestPlay({
          userId: userId,
          courseId: test.course.toString(),
        });
      }
    }

    return NextResponse.json({
      attempt: {
        id: attempt._id.toString(),
        status: attempt.status,
        startedAt: attempt.startedAt,
        answers: attempt.status === "in_progress" ? (attempt.answers ?? {}) : {},
      },
    });
  } catch (error) {
    console.error("mock-test attempt POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
