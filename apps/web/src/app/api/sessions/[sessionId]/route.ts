import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { removeSession } from "@/lib/auth/sessions";

export async function DELETE(
  _request: Request,
  { params }: { params: { sessionId: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = params.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  try {
    const removed = await removeSession(session.userId, sessionId);
    if (!removed) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("sessions DELETE error", error);
    return NextResponse.json({ error: "Failed to remove session" }, { status: 500 });
  }
}
