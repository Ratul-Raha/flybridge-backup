import { NextResponse } from "next/server";
import { destroySession, readSession } from "@/lib/auth/session";
import { destroySessionRecord } from "@/lib/auth/sessions";

export async function POST() {
  const session = await readSession();
  if (session?.userId && session.sessionId) {
    await destroySessionRecord(session.userId, session.sessionId).catch(() => {});
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
