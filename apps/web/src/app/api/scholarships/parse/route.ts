import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { parseScholarshipInput, type ParsedScholarship } from "@/lib/ai/scholarship";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const institution = typeof body.institution === "string" ? body.institution.trim() : "";
    const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";

    if (!institution) {
      return NextResponse.json({ error: "Institution name is required" }, { status: 400 });
    }
    if (!rawText) {
      return NextResponse.json({ error: "Scholarship text is required" }, { status: 400 });
    }
    if (rawText.length > 20000) {
      return NextResponse.json({ error: "Text is too long (max 20,000 characters)" }, { status: 400 });
    }

    const parsed: ParsedScholarship = await parseScholarshipInput(institution, rawText);
    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("scholarships parse error", error);
    const message = error instanceof Error ? error.message : "AI processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}