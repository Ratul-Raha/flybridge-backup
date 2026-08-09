import { NextRequest, NextResponse } from "next/server";

import { generateSop, type SopDetails, type SopOptions } from "@/lib/ai/sop";
import { readSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 60;

type SopBody = {
  details?: unknown;
  options?: unknown;
};

const LEVELS = new Set([
  "undergraduate",
  "master's",
  "phd",
  "certificate / diploma",
  "exchange / short course",
  "other",
]);

const TONES = new Set(["professional", "academic", "personal"]);
const LENGTHS = new Set(["short", "medium", "long"]);

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SopBody = {};
  try {
    body = (await request.json()) as SopBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const details = (body.details ?? {}) as Record<string, unknown>;
  const options = (body.options ?? {}) as Record<string, unknown>;

  const targetCountry = typeof details.targetCountry === "string" ? details.targetCountry.trim() : "";
  const program = typeof details.program === "string" ? details.program.trim() : "";

  if (!targetCountry || !program) {
    return NextResponse.json(
      { error: "Target country and intended program are required" },
      { status: 400 }
    );
  }

  const level = typeof details.level === "string" ? details.level.toLowerCase() : "";
  if (!LEVELS.has(level)) {
    return NextResponse.json({ error: "Invalid degree level" }, { status: 400 });
  }

  const tone = typeof options.tone === "string" ? options.tone : "professional";
  const length = typeof options.length === "string" ? options.length : "medium";
  if (!TONES.has(tone)) {
    return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
  }
  if (!LENGTHS.has(length)) {
    return NextResponse.json({ error: "Invalid length" }, { status: 400 });
  }

  const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

  const sopDetails: SopDetails = {
    fullName: str(details.fullName),
    targetCountry,
    level,
    program,
    university: str(details.university),
    academicBackground: str(details.academicBackground),
    workExperience: str(details.workExperience),
    achievements: str(details.achievements),
    careerGoals: str(details.careerGoals),
    whyThisProgram: str(details.whyThisProgram),
    personalStory: str(details.personalStory),
    additionalNotes: str(details.additionalNotes),
  };
  const sopOptions: SopOptions = { tone: tone as SopOptions["tone"], length: length as SopOptions["length"] };

  try {
    const stream = await generateSop(sopDetails, sopOptions);

    const encoder = new TextEncoder();
    const sse = stream.pipeThrough(
      new TransformStream<import("@/lib/ai/provider").AiStreamChunk, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ...chunk })}\n\n`));
        },
      })
    );

    return new NextResponse(sse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("sop generator error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message.includes("GROQ_API_KEY") ? message : "Something went wrong" },
      { status: 500 }
    );
  }
}
