import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { getProgram, programs } from "@/lib/programs";
import { connectDb } from "@/lib/db";
import { publicCoursePricing } from "@/lib/course-discount";
import { Course } from "@/lib/models/course";
import { CheckoutPanel } from "@/components/programs/checkout-panel";
import { courseDetails } from "../course-data";
import { BookOpen } from "lucide-react";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: Props): Metadata {
  const program = getProgram(params.slug);
  const details = courseDetails[params.slug];
  return {
    title: `Checkout — ${details?.title ?? program?.title ?? "Course"} | FlyBridge`,
  };
}

export default async function CheckoutPage({ params }: Props) {
  const program = getProgram(params.slug);
  if (!program || !program.hasDb) notFound();

  const details = courseDetails[params.slug];

  await connectDb();
  const course = await Course.findOne({
    slug: params.slug,
    $or: [{ published: true }, { upcoming: true }],
  });
  if (!course) notFound();

  const courseId = course._id.toString();
  const moduleCount = (course.modules ?? []).length;
  const lessonCount = (course.modules ?? []).reduce(
    (n: number, m: any) => n + (m.lessons?.length ?? 0),
    0
  );

  // What the buyer is charged, resolved from the course's own discount so this
  // page and the order it creates can never quote different numbers.
  const pricing = publicCoursePricing(course);

  const checkoutCourse = {
    courseId,
    slug: course.slug,
    title: details?.title ?? course.title,
    subtitle: details?.subtitle ?? course.subtitle ?? "",
    description: details?.desc ?? course.description ?? "",
    image: course.image ?? null,
    badge: details?.badge ?? course.badge ?? "COURSE",
    price: course.price ?? 0,
    currency: course.currency ?? "USD",
    prices: pricing.prices,
    originalPrice: pricing.configured
      ? (pricing.originalPrice ?? undefined)
      : (details?.originalPrice ?? undefined),
    discountLabel: pricing.discountLabel,
    level: details?.level ?? course.level ?? "",
    language: details?.language ?? course.language ?? "",
    pace: details?.pace ?? course.pace ?? "",
    upcoming: course.upcoming === true,
  };

  return (
    <div className="checkout-page">
      <Nav />

      {/* Breadcrumb */}
      <div className="px-[clamp(20px,4.5vw,56px)] pt-[120px] pb-4 max-w-[1320px] mx-auto">
        <div className="flex items-center gap-2 text-[12.5px] font-medium">
          <Link
            href="/"
            style={{ color: "var(--body)" }}
            className="hover:text-brand-2 transition-colors"
          >
            Home
          </Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <Link
            href="/programs"
            style={{ color: "var(--body)" }}
            className="hover:text-brand-2 transition-colors"
          >
            Programs
          </Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <Link
            href={`/programs/${params.slug}`}
            style={{ color: "var(--body)" }}
            className="hover:text-brand-2 transition-colors"
          >
            {checkoutCourse.badge}
          </Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <span style={{ color: "var(--brand-2)" }}>Checkout</span>
        </div>
      </div>

      {/* Main checkout grid */}
      <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px] max-w-[1320px] mx-auto">
        <CheckoutPanel
          course={checkoutCourse}
          moduleCount={moduleCount}
          lessonCount={lessonCount}
          product={
            <div className="rounded-lg border border-line bg-white overflow-hidden">
              <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                <div
                  className="relative h-[180px] sm:h-full sm:min-h-[180px] flex items-center justify-center overflow-hidden"
                  style={{ background: "var(--brand-soft)" }}
                >
                  {checkoutCourse.image ? (
                    <>
                      <Image
                        src={checkoutCourse.image}
                        alt={checkoutCourse.title}
                        fill
                        sizes="200px"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(18,32,67,0.18), transparent 50%)",
                        }}
                      />
                    </>
                  ) : (
                    <BookOpen size={36} className="text-white/40" />
                  )}
                </div>
                <div className="p-5 sm:p-6 flex flex-col justify-center">
                  <span
                    className="font-mono text-[10px] font-semibold tracking-[0.3em] mb-2 inline-block w-fit"
                    style={{ color: "var(--brand-2)" }}
                  >
                    {checkoutCourse.badge.toUpperCase()}
                  </span>
                  <h1
                    className="font-display text-[19px] font-semibold leading-[1.3]"
                    style={{ color: "var(--ink)" }}
                  >
                    {checkoutCourse.title}
                    {checkoutCourse.subtitle && <> {checkoutCourse.subtitle}</>}
                  </h1>
                  {checkoutCourse.description && (
                    <p
                      className="mt-2 text-[13px] leading-[1.6] line-clamp-2"
                      style={{ color: "var(--body)" }}
                    >
                      {checkoutCourse.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          }
        />
      </section>

      <style>{`
        .checkout-page {
          --body: #39445A;
          --line: #DDE2EC;
        }
      `}</style>
    </div>
  );
}
