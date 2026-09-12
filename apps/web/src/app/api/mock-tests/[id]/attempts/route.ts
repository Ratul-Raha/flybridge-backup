import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest } from "@/lib/models/mock-test";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";
import { resolveMockTestOwnership, testIsOwned } from "@/lib/mock-tests";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const test = await MockTest.findById(params.id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    if (!isManager(session) && test.status !== "published") {
      return NextResponse.json({ error: "Test not available" }, { status: 403 });
    }

    const ownership = await resolveMockTestOwnership(session.userId);
    if (!isManager(session) && !testIsOwned(ownership, test)) {
      return NextResponse.json(
        { error: "Purchase required to take this test" },
        { status: 403 }
      );
    }

    const existing = await MockTestAttempt.findOne({
      user: session.userId,
      test: test._id,
      status: "in_progress",
    });

    const attempt =
      existing ??
      (await MockTestAttempt.create({
        user: session.userId,
        test: test._id,
        bundle: test.bundle,
        status: "in_progress",
        startedAt: new Date(),
      }));

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