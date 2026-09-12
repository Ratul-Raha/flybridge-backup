import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const attempts = await MockTestAttempt.find({
      user: session.userId,
      status: { $ne: "in_progress" },
    })
      .sort({ submittedAt: -1 })
      .populate("test", "title skill")
      .lean();

    return NextResponse.json({
      attempts: attempts.map((a) => {
        const test = (a as unknown as { test?: { _id?: { toString(): string }; title?: string; skill?: string } }).test;
        const result = (a.result ?? {}) as {
          band?: number;
          feedback?: string;
        };
        return {
          id: a._id.toString(),
          testId: test?._id?.toString() ?? "",
          title: test?.title ?? "",
          skill: test?.skill ?? "",
          status: a.status,
          band: typeof result.band === "number" ? result.band : null,
          submittedAt: a.submittedAt ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("mock-test attempts GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}