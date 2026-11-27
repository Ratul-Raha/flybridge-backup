import "server-only";
import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { COURSES_TAG } from "@/lib/course-cache";
import {
  isHiddenCourseListing,
  listingImageSourceSlug,
  staticProgramsWithoutDbCourse,
  type Program,
} from "@/lib/programs";
import { displayEnrollmentCount } from "@/lib/enrollment-display";
import { publicCoursePricing } from "@/lib/course-discount";
import { courseDetails } from "@/app/programs/[slug]/course-data";
import type { DbCourse } from "@/components/programs/db-course-card";

export type PublicCourseListings = {
  courses: DbCourse[];
  staticPrograms: Program[];
  programCount: number;
};

async function getPublicCourseListingsUncached(): Promise<PublicCourseListings> {
  let courses: Awaited<ReturnType<typeof Course.find>> = [];
  let enrollMap = new Map<string, number>();

  try {
    await connectDb();
    const [dbCourses, enrollCounts] = await Promise.all([
      Course.find({ $or: [{ published: true }, { upcoming: true }] }).sort({ createdAt: -1 }),
      CourseEnrollment.aggregate([{ $group: { _id: "$course", count: { $sum: 1 } } }]),
    ]);
    courses = dbCourses;
    enrollMap = new Map(enrollCounts.map((r) => [r._id.toString(), r.count as number]));
  } catch {
    courses = [];
  }

  const imageBySlug = new Map(courses.map((c) => [c.slug.toLowerCase(), c.image ?? null]));
  const cardImage = (slug: string, fallback?: string | null) => {
    const sourceSlug = listingImageSourceSlug(slug);
    const sourceImage = sourceSlug ? imageBySlug.get(sourceSlug.toLowerCase()) : null;
    return sourceImage || fallback || null;
  };

  const dbCourses = courses
    .filter((course) => !isHiddenCourseListing(course.slug))
    .map((c) => {
      const itemId = c._id.toString();
      const pricing = publicCoursePricing(c);

      return {
        id: itemId,
        slug: c.slug,
        title: c.title,
        badge: c.badge ?? "",
        subtitle: c.subtitle ?? "",
        description: c.description ?? "",
        price: c.price ?? 0,
        currency: c.currency ?? "USD",
        prices: pricing.prices,
        originalPrice: pricing.configured
          ? (pricing.originalPrice ?? undefined)
          : (courseDetails[c.slug]?.originalPrice ?? undefined),
        discountLabel: pricing.discountLabel,
        discountEndsAt: pricing.endsAt,
        image: cardImage(c.slug, c.image ?? null),
        level: c.level ?? "",
        upcoming: c.upcoming ?? false,
        enrollmentCount: displayEnrollmentCount(c.slug, enrollMap.get(itemId) ?? 0),
        modules: (c.modules ?? []).map((m) => ({
          title: m.title,
          lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
        })),
      } satisfies DbCourse;
    })
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount);

  const staticPrograms = staticProgramsWithoutDbCourse(dbCourses).map((p) => ({
    ...p,
    image: cardImage(p.slug, p.image) ?? undefined,
  }));

  return {
    courses: dbCourses,
    staticPrograms,
    programCount: dbCourses.length + staticPrograms.length,
  };
}

export const getPublicCourseListings = unstable_cache(
  getPublicCourseListingsUncached,
  ["public-course-listings-v1"],
  { revalidate: 60, tags: [COURSES_TAG] },
);
