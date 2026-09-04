import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { PushSubscription } from "@/lib/models/push-subscription";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string }; userAgent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "endpoint, keys.p256dh and keys.auth are required" },
      { status: 400 },
    );
  }

  try {
    await connectDb();
    const userAgent = (body.userAgent ?? "").slice(0, 500);
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          user: session.userId,
          p256dh,
          auth,
          userAgent,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push subscribe error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
