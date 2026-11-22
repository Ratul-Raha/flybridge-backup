import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpokenEnglishLanding } from "@/components/spoken-english-landing";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseReview } from "@/lib/models/course-review";
import { readSession } from "@/lib/auth/session";
import { getProgram } from "@/lib/programs";
import { courseDetails } from "../programs/[slug]/course-data";

const SLUG = "easy-smart-spoken-english";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const program = getProgram(SLUG);
  const details = courseDetails[SLUG];
  const title = `${details?.title ?? program?.title ?? "Spoken English"} | FlyBridge Education Group`;

  return {
    title,
    description: details?.desc ?? program?.desc,
    openGraph: {
      type: "website",
      title,
      description: details?.desc ?? program?.desc,
      url: `/${SLUG}`,
      images: program?.image ? [{ url: program.image }] : undefined,
    },
  };
}

export default async function SpokenEnglishLandingPage() {
  await connectDb();

  const course = await Course.findOne({
    slug: SLUG,
    $or: [{ published: true }, { upcoming: true }],
  });

  if (!course) notFound();

  const session = await readSession();
  const [enrolledDoc, reviewDocs] = await Promise.all([
    session?.userId
      ? CourseEnrollment.exists({
          user: session.userId,
          course: course._id,
          status: "active",
        })
      : null,
    CourseReview.find({ course: course._id, text: { $ne: "" } })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
  ]);
  const enrolled = Boolean(enrolledDoc);
  const reviews = reviewDocs
    .map((review) => {
      const user = review.user as { name?: string } | null;
      return {
        id: review._id.toString(),
        rating: review.rating,
        text: review.text.trim(),
        userName: user?.name?.trim() || "শিক্ষার্থী",
      };
    })
    .filter((review) => review.text.length > 0);

  return <SpokenEnglishLanding enrolled={enrolled} reviews={reviews} />;
}
