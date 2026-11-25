import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { type DbCourse } from "@/components/programs/db-course-card";
import { type RelatedProgram } from "@/components/programs/related-program-card";
import {
  ProgramDetail,
  type ProgramDetailBook,
  type ProgramDetailCurriculum,
  type ProgramDetailReviewData,
  type ProgramDetailStat,
} from "@/components/programs/program-detail";
import { type ReviewItem } from "@/components/programs/reviews-section";
import { getProgram, isHiddenCourseListing, staticProgramsWithoutDbCourse } from "@/lib/programs";
import { displayEnrollmentCount } from "@/lib/enrollment-display";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import { connectDb } from "@/lib/db";
import { formatMoney } from "@/lib/pricing";
import { publicCoursePricing } from "@/lib/course-discount";
import { hasFreePreview } from "@/lib/course-preview";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseReview } from "@/lib/models/course-review";
import { readSession } from "@/lib/auth/session";
import { MetaProductView } from "@/components/meta-product-view";
import {
  SpokenEnglishLanding,
  type SpokenEnglishStudentAvatar,
} from "@/components/spoken-english-landing";
import { IeltsReadingLanding } from "@/components/ielts-reading-landing";
import IeltsBandScoreLanding from "@/components/ielts/ielts-band-score-landing";
import { courseDetails } from "./course-data";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

type ProgramModule = {
  title: string;
  lessons: { title: string; duration?: string }[];
};

const getReviewsCached = unstable_cache(
  async (courseId: string) => {
    const reviews = await CourseReview.find({ course: courseId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      text: r.text,
      userName: (r.user as any)?.name ?? "Anonymous",
      userAvatar: (r.user as any)?.avatar ?? null,
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    })) as ReviewItem[];
  },
  ["program-course-reviews"],
  { revalidate: 60 },
);

const getOtherDbCoursesCached = unstable_cache(
  async (slug: string) => {
    const [otherEnrollCounts, dbCourses] = await Promise.all([
      CourseEnrollment.aggregate([{ $group: { _id: "$course", count: { $sum: 1 } } }]),
      Course.find({
        slug: { $ne: slug },
        $or: [{ published: true }, { upcoming: true }],
      })
        .sort({ createdAt: -1 })
        .limit(4),
    ]);
    const enrollMap = new Map(otherEnrollCounts.map((r) => [r._id.toString(), r.count as number]));
    return dbCourses
      .filter((course) => !isHiddenCourseListing(course.slug))
      .map((c) => {
        const courseId = c._id.toString();
        const pricing = publicCoursePricing(c);
        return {
          id: courseId,
          slug: c.slug,
          title: c.title,
          badge: c.badge ?? "",
          subtitle: c.subtitle ?? "",
          description: c.description ?? "",
          price: c.price ?? 0,
          currency: c.currency ?? "USD",
          prices: pricing.prices,
          originalPrice: pricing.originalPrice ?? undefined,
          image: c.image ?? null,
          level: c.level ?? "",
          upcoming: c.upcoming ?? false,
          averageRating: c.averageRating ?? 0,
          enrollmentCount: displayEnrollmentCount(c.slug, enrollMap.get(courseId) ?? 0),
          modules: (c.modules ?? []).map((m) => ({
            title: m.title,
            lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
          })),
        } as DbCourse;
      });
  },
  ["program-other-courses"],
  { revalidate: 60 },
);

function buildCurriculum(modules: ProgramModule[]): ProgramDetailCurriculum | undefined {
  if (modules.length === 0) return undefined;
  const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
  return {
    label: "CURRICULUM",
    title: "Course curriculum",
    subtitle: `${modules.length} modules · ${lessonCount} lessons`,
    modules: modules.map((module) => ({
      title: module.title,
      lessonCount: `${module.lessons.length} lessons`,
      items: module.lessons.map((lesson) => lesson.title),
    })),
  };
}

function deriveStats({
  details,
  course,
  lessonCount,
  moduleCount,
  books,
  certificate,
}: {
  details: (typeof courseDetails)[string] | undefined;
  course: Awaited<ReturnType<typeof Course.findOne>>;
  lessonCount: number;
  moduleCount: number;
  books: ProgramDetailBook[];
  certificate?: { title: string; desc: string };
}): ProgramDetailStat[] {
  if (details?.heroStats?.length) return details.heroStats;
  if (details?.stats?.length) return details.stats;

  const stats: ProgramDetailStat[] = [];
  if (lessonCount > 0) stats.push({ value: String(lessonCount), label: "Lessons" });
  if (moduleCount > 0) stats.push({ value: String(moduleCount), label: "Modules" });
  if (books.length > 0) stats.push({ value: String(books.length), label: "Course books" });
  if (course?.certificateEnabled || certificate) stats.push({ value: "Yes", label: "Certificate" });
  return stats.slice(0, 4);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = getProgram(params.slug);
  const details = courseDetails[params.slug];

  let courseTitle: string | undefined;
  let courseDescription: string | undefined;
  let courseImage: string | undefined;

  try {
    await connectDb();
    const course = await Course.findOne({
      slug: params.slug,
      $or: [{ published: true }, { upcoming: true }],
    })
      .select("title description image")
      .lean();
    if (course) {
      courseTitle = course.title;
      courseDescription = course.description ?? undefined;
      courseImage = course.image ?? undefined;
    }
  } catch {
    /* fall back to static metadata */
  }

  const title = `${details?.title ?? courseTitle ?? program?.title ?? "Program"} | FlyBridge Education Group`;
  const description = details?.desc ?? courseDescription ?? program?.desc;
  const image = courseImage ?? program?.image ?? details?.book?.image;

  if (program || details || courseTitle) {
    return {
      title,
      description,
      alternates: { canonical: `/programs/${params.slug}` },
      openGraph: {
        type: "article",
        title,
        description,
        url: `/programs/${params.slug}`,
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  }

  return { title: "Course | FlyBridge" };
}

export default async function ProgramPage({ params }: Props) {
  const program = getProgram(params.slug);

  if (program?.hidden) notFound();

  if (params.slug === "ielts-band-score-machine") {
    return <IeltsBandScoreLanding />;
  }

  await connectDb();

  const course = await Course.findOne({
    slug: params.slug,
    $or: [{ published: true }, { upcoming: true }],
  });

  if (!program && !course) notFound();

  const details = courseDetails[params.slug];
  const session = await readSession();

  const enrolled =
    course && session?.userId
      ? Boolean(
          await CourseEnrollment.exists({
            user: session.userId,
            course: course._id,
            status: "active",
          }),
        )
      : false;

  if (params.slug === "easy-smart-spoken-english") {
    if (!course) notFound();

    const [studentCount, enrollmentSamples] = await Promise.all([
      CourseEnrollment.countDocuments({ course: course._id, status: "active" }),
      CourseEnrollment.find({ course: course._id, status: "active" })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("user", "name avatar")
        .lean(),
    ]);

    const students: SpokenEnglishStudentAvatar[] = enrollmentSamples
      .map((enrollment) => {
        const user = enrollment.user as { name?: string | null; avatar?: string | null } | null;
        return {
          name: user?.name?.trim() || "শিক্ষার্থী",
          avatar: user?.avatar ?? null,
        };
      })
      .slice(0, 4);

    return (
      <SpokenEnglishLanding
        enrolled={enrolled}
        studentCount={studentCount}
        studentAvatars={students}
      />
    );
  }

  if (params.slug === "easy-smart-ielts-reading") {
    if (!course) notFound();
    return <IeltsReadingLanding enrolled={enrolled} />;
  }

  const staticModules: ProgramModule[] = details?.modules ?? [];
  const dbModules: ProgramModule[] = (course?.modules ?? []).map((module) => ({
    title: module.title,
    lessons: (module.lessons ?? []).map((lesson) => ({ title: lesson.title })),
  }));

  const lessonCount =
    details?.lessonCount ??
    (details
      ? staticModules.reduce((total, module) => total + module.lessons.length, 0)
      : dbModules.reduce((total, module) => total + module.lessons.length, 0));
  const moduleCount =
    details?.moduleCount ??
    (details ? (details.curriculum?.modules.length ?? staticModules.length) : dbModules.length);

  const books: ProgramDetailBook[] = details?.book
    ? [
        {
          title: details.book.title,
          description: details.book.includedNote || details.book.desc,
          image: details.book.image,
          badge: "Included free",
        },
      ]
    : (course?.books ?? []).map((book) => ({
        title: book.title,
        description: book.description || undefined,
        badge: "Included",
      }));

  const certificate =
    details?.certificate ??
    (course?.certificateEnabled
      ? {
          title: "Completion certificate",
          desc: "Earn a verified certificate when you complete the program.",
        }
      : undefined);

  const features = details?.features ?? (details ? BLUEPRINT_FEATURES : undefined);

  const curriculum: ProgramDetailCurriculum | undefined = details?.curriculum
    ? {
        label: details.curriculum.label,
        title: details.curriculum.title,
        subtitle: details.curriculum.subtitle,
        modules: details.curriculum.modules.map((module) => ({
          title: module.title,
          lessonCount: module.lessonCount,
          items: module.items,
          capstone: module.capstone,
        })),
        note: details.curriculum.note,
      }
    : buildCurriculum(details ? staticModules : dbModules);

  let reviewData: ProgramDetailReviewData | undefined;
  if (course) {
    const courseId = course._id.toString();
    const [items, userReviewDoc] = await Promise.all([
      getReviewsCached(courseId),
      session?.userId
        ? CourseReview.findOne({ course: course._id, user: session.userId }).lean()
        : null,
    ]);
    reviewData = {
      courseId,
      items,
      total: Math.max(course.reviewCount ?? 0, items.length),
      average:
        course.averageRating && course.averageRating > 0
          ? course.averageRating
          : (details?.rating?.average ?? 0),
      userReview: userReviewDoc
        ? {
            id: userReviewDoc._id.toString(),
            rating: userReviewDoc.rating,
            text: userReviewDoc.text,
          }
        : null,
    };
  } else if (details?.reviews?.length) {
    const items: ReviewItem[] = details.reviews.map((review, index) => ({
      id: `${review.name}-${index}`,
      userName: review.name,
      rating: review.rating,
      text: review.text,
      date: review.date,
      helpful: review.helpful,
      verified: review.verified,
    }));
    reviewData = {
      items,
      total: items.length,
      average: details.rating?.average ?? 0,
    };
  }

  const rating = reviewData
    ? reviewData.average > 0
      ? { average: reviewData.average, count: reviewData.total }
      : details?.rating
        ? { average: details.rating.average, count: details.rating.count }
        : undefined
    : details?.rating
      ? { average: details.rating.average, count: details.rating.count }
      : undefined;

  const price = publicCoursePricing(course ?? { prices: {} });
  const isUpcoming = Boolean(course?.upcoming ?? program?.upcoming);
  const isFree = course
    ? (price.price ?? course.price ?? 0) <= 0
    : details?.price === "Free" ||
      details?.pricing?.price === "Free" ||
      (!details?.price && !details?.pricing?.price);

  const priceCurrent = course
    ? price.price != null
      ? formatMoney(price.price, "BDT")
      : (course.price ?? 0) > 0
        ? formatMoney(course.price ?? 0, course.currency ?? "USD")
        : undefined
    : (details?.price ?? details?.pricing?.price);

  const priceOriginal = course
    ? (price.originalPrice ?? undefined)
    : (details?.originalPrice ?? undefined);
  const discountLabel = course
    ? (price.discountLabel ?? undefined)
    : (details?.dealLabel ?? (details?.savings ? "Launch offer" : undefined));
  const discountEndsAt = course ? (price.endsAt ?? undefined) : undefined;

  const canCheckout = Boolean(course) || Boolean(details?.heroCta?.href);
  const enrollmentHref = enrolled
    ? `/dashboard/courses/${params.slug}/learn`
    : isUpcoming
      ? course?.waitlistEnabled
        ? "#waitlist"
        : "#enroll"
      : (details?.heroCta?.href ??
        (canCheckout ? `/programs/${params.slug}/checkout` : "/programs"));
  const enrollmentLabel = enrolled
    ? "Open course"
    : isUpcoming
      ? course?.waitlistEnabled
        ? "Join waitlist"
        : "Coming soon"
      : canCheckout
        ? isFree
          ? "Start learning"
          : "Enroll now"
        : "Browse programs";

  const hasPreview = course ? (price.price ?? 0) > 0 && hasFreePreview(course) : false;

  const otherDbCourses = await getOtherDbCoursesCached(params.slug);
  const relatedPrograms: RelatedProgram[] = [
    ...staticProgramsWithoutDbCourse(otherDbCourses)
      .filter((item) => item.slug !== params.slug)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        badge: item.badge,
        badgeColor: item.badgeColor,
        bg: item.bg,
        image: item.image ?? null,
        sub: item.upcoming ? "Coming soon" : (item.price ?? "Explore course"),
        originalSub: item.upcoming ? undefined : item.originalPrice,
      })),
    ...otherDbCourses.map((item) => ({
      slug: item.slug,
      title: item.title,
      badge: item.badge || "COURSE",
      badgeColor: "var(--brand)",
      bg: "var(--brand-soft)",
      image: item.image,
      sub: item.upcoming
        ? "Coming soon"
        : item.prices?.BDT != null && item.prices.BDT > 0
          ? formatMoney(item.prices.BDT, "BDT")
          : item.subtitle || item.description || "Explore course",
      originalSub: item.upcoming ? undefined : item.originalPrice,
    })),
  ].slice(0, 3);

  const title = details?.title ?? course?.title ?? program?.title ?? "Program";
  const description =
    details?.desc ?? course?.description ?? program?.desc ?? "Explore this FlyBridge program.";
  const badge = details?.badge ?? course?.badge ?? program?.badge ?? "PROGRAM";
  const mediaSrc = course?.image ?? details?.book?.image ?? program?.image ?? null;
  const mediaFit = details?.book?.image && !course?.image ? "contain" : "cover";

  const showRefund = !isFree && !isUpcoming;

  return (
    <div>
      {course && (
        <MetaProductView
          contentId={course._id.toString()}
          contentName={course.title}
          value={price.price ?? course.price ?? 0}
          currency="BDT"
        />
      )}
      <Nav />
      <ProgramDetail
        slug={params.slug}
        badge={badge}
        title={title}
        subtitle={details?.subtitle ?? course?.subtitle ?? undefined}
        description={description}
        heroPill={details?.heroPill}
        titleAccent={details?.titleAccent}
        targetBand={details?.targetBand}
        rating={rating}
        level={details?.level ?? course?.level ?? undefined}
        language={details?.language ?? course?.language ?? undefined}
        pace={details?.pace ?? course?.pace ?? undefined}
        access={details?.access}
        stats={deriveStats({ details, course, lessonCount, moduleCount, books, certificate })}
        outcomes={details?.outcomes ?? []}
        features={features}
        featuresDesc={details?.featuresDesc}
        curriculum={curriculum}
        comparison={details?.comparison}
        faqs={details?.faqs}
        books={books}
        certificate={certificate}
        price={{
          current: priceCurrent,
          original: priceOriginal,
          discountLabel,
          endsAt: discountEndsAt,
        }}
        isFree={isFree}
        media={{ src: mediaSrc, alt: title, fit: mediaFit }}
        lessonCount={lessonCount}
        moduleCount={moduleCount}
        enrollment={{
          enrolled,
          upcoming: isUpcoming,
          waitlistEnabled: course?.waitlistEnabled ?? false,
          hasFreePreview: hasPreview,
          href: enrollmentHref,
          label: enrollmentLabel,
          wishlistDiscountPercent: course?.wishlistDiscountPercent ?? 0,
        }}
        reviews={reviewData}
        relatedPrograms={relatedPrograms}
        showRefund={showRefund}
      />
    </div>
  );
}
