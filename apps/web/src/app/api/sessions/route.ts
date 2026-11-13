import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { listSessions, MAX_SESSIONS } from "@/lib/auth/sessions";

export async function GET() {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await listSessions(session.userId);
    return NextResponse.json({
      sessions: sessions.map((s) => ({ ...s, current: s.sessionId === session.sessionId })),
      limit: MAX_SESSIONS,
    });
  } catch (error) {
    console.error("sessions GET error", error);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}
