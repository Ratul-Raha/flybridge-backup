import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { revalidateUserDashboard } from "@/lib/dashboard/tags";
import {
  computeReadiness,
  isReadinessAnswer,
  READINESS_QUESTIONS,
  type ReadinessQuestionId,
} from "@/lib/readiness/questions";
import {
  ReadinessRun,
  serializeReadinessRun,
  type ReadinessRunDoc,
} from "@/lib/models/readiness-run";

export const runtime = "nodejs";

function optionLabel(questionId: string, value: unknown): string {
  const q = READINESS_QUESTIONS.find((item) => item.id === questionId);
  if (!q || typeof value !== "string") return "";
  return q.options.find((o) => o.value === value)?.label ?? "";
}

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const latest = await ReadinessRun.findOne({ user: session.userId }).sort({
      createdAt: -1,
    });
    if (!latest) {
      return NextResponse.json({ assessment: null });
    }
    return NextResponse.json({ assessment: serializeReadinessRun(latest) });
  } catch (error) {
    console.error("readiness run fetch error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { runId?: unknown; answers?: unknown; report?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const runId = typeof body.runId === "string" && body.runId.trim() ? body.runId.trim() : "";
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }
  if (!isReadinessAnswer(body.answers)) {
    return NextResponse.json(
      { error: "Please answer every question before saving your result" },
      { status: 400 }
    );
  }
  const report = typeof body.report === "string" ? body.report : "";

  try {
    await connectDb();

    const existing = await ReadinessRun.findOne({
      runId,
      user: session.userId,
    });
    if (existing) {
      return NextResponse.json({ assessment: serializeReadinessRun(existing) });
    }

    const result = computeReadiness(body.answers);
    let run: ReadinessRunDoc;
    try {
      run = await ReadinessRun.create({
        runId,
        user: session.userId,
        answers: body.answers,
        result,
        report,
        score: result.score,
        label: result.label,
        country: optionLabel("targetCountry" as ReadinessQuestionId, body.answers.targetCountry),
        degreeLevel: optionLabel("degreeLevel" as ReadinessQuestionId, body.answers.degreeLevel),
      });
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 11000) {
        const found = await ReadinessRun.findOne({ runId });
        if (found) {
          return NextResponse.json({ assessment: serializeReadinessRun(found) });
        }
      }
      throw error;
    }

    revalidateUserDashboard();
    return NextResponse.json({ assessment: serializeReadinessRun(run) }, { status: 201 });
  } catch (error) {
    console.error("readiness run save error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
