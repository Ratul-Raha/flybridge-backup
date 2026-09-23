import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { isS3Ref, getS3ObjectRange } from "@/lib/storage";

function parseIndex(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? -1 : n;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  try {
    const session = await readSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff = session.role === "admin" || session.role === "moderator";

    await connectDb();

    const course = await Course.findOne({
      _id: params.id,
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

    const flatIndex = parseIndex(params.index);
    if (flatIndex < 0) {
      return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
    }

    let lesson: { videoUrl?: string | null } | undefined;
    let cursor = 0;
    for (const mod of course.modules ?? []) {
      for (const l of mod.lessons ?? []) {
        if (cursor === flatIndex) lesson = l;
        cursor++;
      }
    }

    const videoUrl = lesson?.videoUrl;
    if (!videoUrl) {
      return NextResponse.json({ error: "Lesson has no video" }, { status: 404 });
    }

    // Only private S3 videos are proxied. YouTube / legacy URLs are handled
    // by the player directly.
    if (!isS3Ref(videoUrl)) {
      return NextResponse.json({ error: "Not a private video" }, { status: 400 });
    }

    const range = request.headers.get("range") ?? undefined;

    try {
      const { stream, contentLength, contentType, contentRange, statusCode } =
        await getS3ObjectRange(videoUrl, range);

      if (!stream) {
        return NextResponse.json({ error: "Video unavailable" }, { status: 502 });
      }

      // S3 returns 206 for ranged requests; treat a non-206 as a full body.
      const partial = range && statusCode === 206 && contentRange;

      const headers = new Headers();
      headers.set(
        "Content-Type",
        contentType && contentType.startsWith("video/")
          ? contentType
          : "video/mp4"
      );
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "private, no-store");
      headers.set("Content-Disposition", "inline");
      headers.set("X-Content-Type-Options", "nosniff");
      if (contentLength) headers.set("Content-Length", String(contentLength));
      if (partial) {
        headers.set("Content-Range", contentRange!);
        return new Response(stream, { status: 206, headers });
      }
      return new Response(stream, { status: 200, headers });
    } catch (error) {
      console.error("lesson video stream error", error);
      return NextResponse.json({ error: "Video unavailable" }, { status: 502 });
    }
  } catch (error) {
    console.error("lesson video GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}