import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { coachSpeaking } from "@/lib/ai/speaking-coach";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    courseId?: unknown;
    prompt?: unknown;
    transcript?: unknown;
    provider?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const courseId = typeof body.courseId === "string" ? body.courseId : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const transcript =
    typeof body.transcript === "string" ? body.transcript.trim() : "";
  const provider =
    typeof body.provider === "string" ? body.provider : undefined;

  if (!courseId) {
    return NextResponse.json({ error: "Missing course" }, { status: 400 });
  }
  if (!prompt || prompt.length > 500) {
    return NextResponse.json(
      { error: "A speaking prompt is required" },
      { status: 400 }
    );
  }
  if (!transcript || transcript.length > 8_000) {
    return NextResponse.json(
      { error: "Record or type an answer first" },
      { status: 400 }
    );
  }
  if (transcript.split(/\s+/).filter(Boolean).length < 3) {
    return NextResponse.json(
      { error: "Speak a little longer — try at least one full sentence." },
      { status: 400 }
    );
  }

  try {
    await connectDb();

    const isStaff = session.role === "admin" || session.role === "moderator";
    const course = await Course.findOne({
      _id: courseId,
      category: "Spoken English",
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

    const feedback = await coachSpeaking({ prompt, transcript, provider });
    return NextResponse.json(feedback, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("speaking practice feedback error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not generate feedback right now",
      },
      { status: 502 }
    );
  }
}
