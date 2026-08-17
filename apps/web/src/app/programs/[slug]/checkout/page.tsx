import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { getProgram, programs } from "@/lib/programs";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CheckoutForm } from "@/components/programs/checkout-form";
import { courseDetails } from "../course-data";
import {
  BookOpen,
  Check,
  Clock,
  Lock,
  ShieldCheck,
  Zap,
} from "lucide-react";

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
  const isFree = (course.price ?? 0) <= 0;
  const moduleCount = (course.modules ?? []).length;
  const lessonCount = (course.modules ?? []).reduce(
    (n: number, m: any) => n + (m.lessons?.length ?? 0),
    0
  );

  const checkoutCourse = {
    courseId,
    slug: course.slug,
    title: details?.title ?? course.title,
    subtitle: details?.subtitle ?? course.subtitle ?? "",
    description: details?.desc ?? course.description ?? "",
    image: course.image ?? null,
    badge: details?.badge ?? course.badge ?? "COURSE",
    price: course.price ?? 0,
    currency: course.currency ?? "BDT",
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
          {/* Left — product + form */}
          <div className="space-y-8">
            {/* Product card */}
            <div className="rounded-2xl border border-line bg-white overflow-hidden">
              <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                <div
                  className="relative h-[180px] sm:h-full sm:min-h-[180px] flex items-center justify-center overflow-hidden"
                  style={{ background: "var(--brand-soft)" }}
                >
                  {checkoutCourse.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={checkoutCourse.image}
                        alt={checkoutCourse.title}
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
                  {(checkoutCourse.level || checkoutCourse.language) && (
                    <div
                      className="mt-2 flex items-center gap-2 text-[12px] font-medium"
                      style={{ color: "var(--body)" }}
                    >
                      {checkoutCourse.level && <span>{checkoutCourse.level}</span>}
                      {checkoutCourse.language && (
                        <>
                          {checkoutCourse.level && <span>·</span>}
                          <span>{checkoutCourse.language}</span>
                        </>
                      )}
                    </div>
                  )}
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

            {/* Checkout form */}
            <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
              <CheckoutForm course={checkoutCourse} />
            </div>
          </div>

          {/* Right — order summary (sticky) */}
          <aside className="lg:sticky lg:top-24">
            <div
              className="rounded-2xl border border-line bg-white overflow-hidden"
              style={{
                boxShadow: "0 32px 60px -32px rgba(18,32,67,0.18)",
              }}
            >
              <div className="p-6">
                <p
                  className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-5"
                  style={{ color: "var(--body)" }}
                >
                  Order summary
                </p>

                {/* Line item */}
                <div
                  className="flex gap-4 pb-5 border-b"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div
                    className="w-[64px] h-[64px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    {checkoutCourse.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={checkoutCourse.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen size={20} className="text-white/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[14px] font-semibold leading-snug"
                      style={{ color: "var(--ink)" }}
                    >
                      {checkoutCourse.title}
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
                      {checkoutCourse.badge}
                    </p>
                  </div>
                </div>

                {/* Price breakdown */}
                <div
                  className="py-4 space-y-2.5 border-b"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span style={{ color: "var(--body)" }}>Subtotal</span>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>
                      {isFree
                        ? "Free"
                        : `${checkoutCourse.currency} ${checkoutCourse.price.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span style={{ color: "var(--body)" }}>Tax</span>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>
                      0.00
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-4">
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    Total
                  </span>
                  <span
                    className="text-[22px] font-bold leading-none"
                    style={{ color: "var(--ink)" }}
                  >
                    {isFree
                      ? "Free"
                      : `${checkoutCourse.currency} ${checkoutCourse.price.toLocaleString()}`}
                  </span>
                </div>

                {checkoutCourse.upcoming && (
                  <div
                    className="mt-4 text-center text-[13px] font-medium py-2.5 rounded-xl"
                    style={{ background: "rgba(111,76,224,0.08)", color: "#6B4CE0" }}
                  >
                    This course is coming soon — join the waitlist to be notified.
                  </div>
                )}
              </div>

              {/* What's included */}
              <div
                className="px-6 pb-6 pt-5 border-t"
                style={{ borderColor: "var(--line)" }}
              >
                <p
                  className="text-[11.5px] font-semibold uppercase tracking-[0.08em] mb-3"
                  style={{ color: "var(--body)" }}
                >
                  What&apos;s included
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Instant access after enrollment",
                    `${moduleCount} modules · ${lessonCount} lessons`,
                    "Lifetime access — learn at your own pace",
                    "Certificate of completion",
                    "Live support from instructors",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px]">
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-[1px]"
                        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                      >
                        <Check className="w-[10px] h-[10px]" strokeWidth={3} />
                      </span>
                      <span style={{ color: "var(--ink)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust badges */}
              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: Lock, label: "SSL Encrypted" },
                    { icon: ShieldCheck, label: "30-day guarantee" },
                    { icon: Zap, label: "Instant access" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span
                        className="text-[10.5px] font-medium leading-tight"
                        style={{ color: "var(--body)" }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
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
