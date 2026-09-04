import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  }
  return NextResponse.json({ key });
}
