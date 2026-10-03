import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";
import type { MyAttempt } from "@/lib/mock-test-ui";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.userId;
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const attempts = await MockTestAttempt.find({ user: userId, status: "graded" })
      .sort({ submittedAt: 1 })
      .populate("test", "title skill")
      .lean();

    return NextResponse.json({
      attempts: attempts.map((a) => {
        const test = (a as unknown as {
          test?: { _id?: { toString(): string }; title?: string; skill?: string };
        }).test;
        const result = (a.result ?? {}) as {
          overallBand?: number;
          sections?: { key: string; title: string; band: number; comments: string }[];
          feedback?: string;
        };
        return {
          id: a._id.toString(),
          testId: test?._id?.toString() ?? "",
          title: test?.title ?? "",
          skill: test?.skill ?? "",
          overallBand: typeof result.overallBand === "number" ? result.overallBand : null,
          sections: Array.isArray(result.sections) ? result.sections : [],
          feedback: typeof result.feedback === "string" ? result.feedback : "",
          submittedAt: a.submittedAt ?? null,
        } as MyAttempt;
      }),
    });
  } catch (error) {
    console.error("mock-test my-attempts GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
