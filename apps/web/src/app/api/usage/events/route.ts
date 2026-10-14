import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { UsageEvent, USAGE_EVENT_TYPES } from "@/lib/models/usage-event";

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId || session.role !== "user") {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const body = await request.json();
    const event = typeof body.event === "string" ? body.event : "";
    const path = typeof body.path === "string" ? body.path.trim() : "";
    if (!(USAGE_EVENT_TYPES as readonly string[]).includes(event)) {
      return NextResponse.json({ error: "Invalid usage event" }, { status: 400 });
    }
    if (
      !path.startsWith("/dashboard/") ||
      path.startsWith("/dashboard/admin/") ||
      path.length > 300
    ) {
      return NextResponse.json({ error: "Invalid usage path" }, { status: 400 });
    }

    const courseSlug =
      typeof body.courseSlug === "string" ? body.courseSlug.trim().slice(0, 120) : undefined;
    const moduleIndex =
      Number.isInteger(body.moduleIndex) && body.moduleIndex >= 0 ? body.moduleIndex : undefined;
    const lessonIndex =
      Number.isInteger(body.lessonIndex) && body.lessonIndex >= 0 ? body.lessonIndex : undefined;

    await connectDb();
    await UsageEvent.create({
      user: session.userId,
      event,
      path,
      courseSlug,
      moduleIndex,
      lessonIndex,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("usage event error", error);
    return new NextResponse(null, { status: 204 });
  }
}
