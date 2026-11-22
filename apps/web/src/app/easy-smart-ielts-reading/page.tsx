import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IeltsReadingLanding } from "@/components/ielts-reading-landing";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { readSession } from "@/lib/auth/session";

const SLUG = "easy-smart-ielts-reading";
const TITLE = "Easy & Smart IELTS Reading | FlyBridge Education Group";
const DESCRIPTION =
  "Learn practical IELTS Reading skills and question-solving strategies in 40 days, with just 20 minutes of learning per day.";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url: `/${SLUG}`,
    },
  };
}

export default async function IeltsReadingLandingPage() {
  await connectDb();

  const course = await Course.findOne({
    slug: SLUG,
    $or: [{ published: true }, { upcoming: true }],
  });

  if (!course) notFound();

  const session = await readSession();
  const enrolledDoc = session?.userId
    ? await CourseEnrollment.exists({
        user: session.userId,
        course: course._id,
        status: "active",
      })
    : null;

  return <IeltsReadingLanding enrolled={Boolean(enrolledDoc)} />;
}
