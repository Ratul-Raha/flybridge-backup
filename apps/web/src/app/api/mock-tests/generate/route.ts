import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { generateMockTestStructure } from "@/lib/ai/ielts-structure";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`mock-structure:${session!.userId ?? session!.uid}`, 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const skill = body.skill;
    if (skill !== "reading" && skill !== "listening" && skill !== "writing") {
      return NextResponse.json({ error: "Invalid skill" }, { status: 400 });
    }
    const questionBlob = typeof body.questionBlob === "string" ? body.questionBlob.trim() : "";
    if (!questionBlob) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }
    const answerBlob = typeof body.answerBlob === "string" ? body.answerBlob.trim() : "";

    const content = await generateMockTestStructure({ skill, questionBlob, answerBlob });

    return NextResponse.json({ ok: true, content }, { status: 200 });
  } catch (error) {
    console.error("mock-test generate error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message.includes("JSON") ? "AI returned an unreadable structure. Try again." : message },
      { status: 500 }
    );
  }
}