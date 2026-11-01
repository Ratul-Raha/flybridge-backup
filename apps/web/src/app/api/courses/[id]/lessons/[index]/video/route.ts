import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { recordLessonPlay } from "@/lib/refunds";
import { isS3Configured } from "@/lib/s3";
import { isS3Ref, signMediaUrl } from "@/lib/storage";
import { isFreeLesson, lessonAtFlatIndex } from "@/lib/course-preview";

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

    const flatIndex = parseIndex(params.index);
    if (flatIndex < 0) {
      return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
    }

    const lesson = lessonAtFlatIndex<{ videoUrl?: string | null; freePreview?: boolean | null }>(
      course,
      flatIndex
    );

    const enrolled = isStaff
      ? true
      : Boolean(
          await CourseEnrollment.exists({
            user: session.userId,
            course: course._id,
            status: "active",
          })
        );

    // Free-preview lessons are playable by any signed-in user; everything else
    // still needs an active enrollment.
    if (!enrolled && !isFreeLesson(lesson)) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    // Backstop for the learn page counter: the very first request for a lesson
    // counts as playing it. Range follow-ups are skipped so streaming stays cheap.
    // Preview access never touches refund usage.
    if (enrolled && !isStaff && session.userId && !request.headers.get("range")) {
      await recordLessonPlay({ userId: session.userId, courseId: course._id.toString(), flatIndex });
    }

    const videoUrl = lesson?.videoUrl;
    if (!videoUrl) {
      return NextResponse.json({ error: "Lesson has no video" }, { status: 404 });
    }

    // Only private S3 videos are redirected here. YouTube / legacy URLs are
    // handled by the player directly.
    if (!isS3Ref(videoUrl)) {
      return NextResponse.json({ error: "Not a private video" }, { status: 400 });
    }

    if (!isS3Configured()) {
      return NextResponse.json({ error: "Video unavailable" }, { status: 502 });
    }

    // Sign a short-lived S3 URL and redirect so the video streams straight from
    // S3 to the learner. Proxying it through this Function would bill every byte
    // twice (Fast Origin Transfer + Fast Data Transfer).
    try {
      const signed = await signMediaUrl(videoUrl, 2 * 60 * 60);
      const res = NextResponse.redirect(signed, 302);
      res.headers.set("Cache-Control", "no-store");
      return res;
    } catch (error) {
      console.error("lesson video signing error", error);
      return NextResponse.json({ error: "Video unavailable" }, { status: 502 });
    }
  } catch (error) {
    console.error("lesson video GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
