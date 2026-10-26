import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { readSession } from "@/lib/auth/session";
import { signMediaUrl, isS3Ref } from "@/lib/storage";
import { recordLessonPlay } from "@/lib/refunds";
import { resolveLessonSkill } from "@/lib/ai/quiz";
import { LessonPlayer } from "@/components/programs/lesson-player";

function videoPlaybackUrl(courseId: string, videoUrl?: string | null, flatIndex?: number): string {
  if (isS3Ref(videoUrl)) {
    return `/api/courses/${courseId}/lessons/${flatIndex ?? 0}/video`;
  }
  return videoUrl ?? "";
}

function LockedScreen({
  title,
  desc,
  href,
  label,
}: {
  title: string;
  desc: string;
  href: string;
  label: string;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <p className="font-display text-[20px] font-semibold" style={{ color: "var(--ink)" }}>
        {title}
      </p>
      <p className="text-[14px] max-w-[420px]" style={{ color: "var(--body)" }}>
        {desc}
      </p>
      <a
        href={href}
        className="rounded-full text-white text-[14px] font-medium px-6 py-[11px] hover:opacity-90 transition-opacity"
        style={{ background: "var(--brand)" }}
      >
        {label}
      </a>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Lesson Player | FlyBridge",
};

type Props = {
  params: { slug: string };
  searchParams: { lesson?: string };
};

export default async function LearnPage({ params, searchParams }: Props) {
  const session = await readSession();
  if (!session || !session.userId) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/courses/${params.slug}/learn`)}`);
  }

  await connectDb();
  const course = await Course.findOne({ slug: params.slug });

  if (!course) {
    return (
      <LockedScreen
        title="This course isn&apos;t live yet"
        desc="The lesson player opens as soon as the course is published. Check back soon."
        href="/dashboard/courses"
        label="Browse courses"
      />
    );
  }

  const isStaff = session.role === "admin" || session.role === "moderator";
  const enrolled =
    session.userId &&
    (await CourseEnrollment.exists({
      user: session.userId,
      course: course._id,
      status: "active",
    }));

  if (!course.published && !isStaff) {
    return (
      <LockedScreen
        title="This course isn&apos;t live yet"
        desc="The lesson player opens as soon as the course is published. Check back soon."
        href="/dashboard/courses"
        label="Browse courses"
      />
    );
  }

  if (!enrolled && !isStaff) {
    return (
      <LockedScreen
        title="You&apos;re not enrolled in this course yet"
        desc="Enroll in the course to unlock step-by-step lessons, practice material and your personal progress tracking."
        href={`/programs/${params.slug}`}
        label="View course"
      />
    );
  }

  const courseId = course._id.toString();
  let flatIndex = 0;

  const lessons = await Promise.all(
    (course.modules ?? []).flatMap((m) =>
      (m.lessons ?? []).map(async (l) => {
        const idx = flatIndex++;
        return {
          moduleTitle: m.title,
          title: l.title,
          duration: l.duration ?? "",
          videoUrl: videoPlaybackUrl(courseId, l.videoUrl, idx),
          pdfUrl: await signMediaUrl(l.pdfUrl),
          content: l.content ?? "",
          quiz: l.quiz !== false,
          skill: resolveLessonSkill(l.skill, l.topics),
        };
      })
    )
  );

  const raw = Number.parseInt(searchParams.lesson ?? "0", 10);
  const initialIndex = Number.isNaN(raw) ? 0 : Math.min(Math.max(raw, 0), Math.max(lessons.length - 1, 0));

  // Opening a lesson counts as playing it. Past the limit this forfeits the
  // 3-day refund — it never blocks the lesson itself.
  if (enrolled && !isStaff && session.userId) {
    await recordLessonPlay({ userId: session.userId, courseId, flatIndex: initialIndex });
  }

  const signedModules = await Promise.all(
    (course.modules ?? []).map(async (m) => ({
      title: m.title,
      lessons: await Promise.all(
        (m.lessons ?? []).map(async (l) => ({
          title: l.title,
          duration: l.duration ?? "",
          videoUrl: videoPlaybackUrl(courseId, l.videoUrl),
          pdfUrl: await signMediaUrl(l.pdfUrl),
          content: l.content ?? "",
          quiz: l.quiz !== false,
          skill: resolveLessonSkill(l.skill, l.topics),
        }))
      ),
    }))
  );

  const signedBooks = await Promise.all(
    (course.books ?? []).map(async (b) => ({
      title: b.title,
      description: b.description ?? "",
      pdfUrl: await signMediaUrl(b.pdfUrl),
    }))
  );

  const guidelinePdfUrl = await signMediaUrl(course.guidelinePdfUrl);

  return (
    <LessonPlayer
      course={{
        id: course._id.toString(),
        slug: course.slug,
        title: course.title,
        image: course.image ?? null,
        category: course.category ?? null,
        modules: signedModules,
        books: signedBooks,
        certificateEnabled: course.certificateEnabled,
        guidelinePdfUrl: guidelinePdfUrl || null,
      }}
      initialIndex={initialIndex}
      lessons={lessons}
      user={{
        name: session.name,
        email: session.email,
      }}
    />
  );
}
