import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { PushSubscription } from "@/lib/models/push-subscription";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }

  try {
    await connectDb();
    await PushSubscription.deleteMany({ endpoint, user: session.userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push unsubscribe error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
