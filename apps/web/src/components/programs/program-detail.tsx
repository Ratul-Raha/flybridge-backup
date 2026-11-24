import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  GraduationCap,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { ComparisonSection, Faq } from "@/app/programs/[slug]/course-data";
import { BengaliText } from "../bengali-text";
import { DealCountdown } from "./deal-countdown";
import { RelatedProgramCard, type RelatedProgram } from "./related-program-card";
import { ReviewsSection, type ReviewItem } from "./reviews-section";
import { WaitlistForm } from "./waitlist-form";
import styles from "./program-detail.module.css";

export type ProgramDetailStat = { value: string; label: string };

export type ProgramDetailBook = {
  title: string;
  description?: string;
  image?: string | null;
  badge?: string;
};

export type ProgramDetailCurriculumModule = {
  title: string;
  lessonCount?: string;
  items: string[];
  capstone?: string;
};

export type ProgramDetailCurriculum = {
  label?: string;
  title: string;
  subtitle?: string;
  modules: ProgramDetailCurriculumModule[];
  note?: string;
};

export type ProgramDetailFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type ProgramDetailReviewData = {
  courseId?: string;
  items: ReviewItem[];
  total: number;
  average: number;
  userReview?: { id: string; rating: number; text: string } | null;
};

export type ProgramDetailEnrollment = {
  enrolled: boolean;
  upcoming: boolean;
  waitlistEnabled: boolean;
  hasFreePreview: boolean;
  href: string;
  label: string;
  wishlistDiscountPercent: number;
};

export type ProgramDetailProps = {
  slug: string;
  badge: string;
  title: string;
  subtitle?: string;
  description: string;
  heroPill?: string;
  titleAccent?: string;
  targetBand?: { label: string; value: string; sub: string };
  rating?: { average: number; count: number };
  level?: string;
  language?: string;
  pace?: string;
  access?: string;
  stats: ProgramDetailStat[];
  outcomes: { title: string; desc?: string }[];
  features?: ProgramDetailFeature[];
  featuresDesc?: string;
  curriculum?: ProgramDetailCurriculum;
  comparison?: ComparisonSection;
  faqs?: Faq[];
  books: ProgramDetailBook[];
  certificate?: { title: string; desc: string };
  price?: {
    current?: string;
    original?: string;
    discountLabel?: string;
    endsAt?: string;
  };
  isFree: boolean;
  media?: { src?: string | null; alt: string; fit?: "cover" | "contain" };
  lessonCount: number;
  moduleCount: number;
  enrollment: ProgramDetailEnrollment;
  reviews?: ProgramDetailReviewData;
  relatedPrograms: RelatedProgram[];
  showRefund: boolean;
};

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span className={styles.stars} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          style={{
            color: index < filled ? "#F59E0B" : "#DCE1EA",
            fill: index < filled ? "#F59E0B" : "transparent",
          }}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.sectionEyebrow}>{eyebrow}</span>
      <h2 className={styles.sectionTitle}>
        <BengaliText>{title}</BengaliText>
      </h2>
      {description && (
        <p className={styles.sectionDescription}>
          <BengaliText>{description}</BengaliText>
        </p>
      )}
    </div>
  );
}

function EnrollCard({
  slug,
  title,
  price,
  isFree,
  enrollment,
  lessonCount,
  moduleCount,
  books,
  certificate,
  access,
  showRefund,
}: {
  slug: string;
  title: string;
  price?: ProgramDetailProps["price"];
  isFree: boolean;
  enrollment: ProgramDetailEnrollment;
  lessonCount: number;
  moduleCount: number;
  books: ProgramDetailBook[];
  certificate?: { title: string; desc: string };
  access?: string;
  showRefund: boolean;
}) {
  const included = [
    moduleCount > 0 && lessonCount > 0 ? `${moduleCount} modules · ${lessonCount} lessons` : null,
    access || "Self-paced learning",
    books.length > 0 ? "Course book included" : null,
    certificate ? "Completion certificate" : null,
    "Live support",
  ].filter((item): item is string => Boolean(item));

  return (
    <div className={styles.enrollCard} id="enroll">
      <div className={styles.enrollHead}>
        <span className={styles.enrollEyebrow}>ENROLLMENT</span>
        {enrollment.enrolled ? (
          <div className={styles.enrolledState}>
            <span className={styles.enrolledIcon}>
              <Check size={16} strokeWidth={3} aria-hidden="true" />
            </span>
            <div>
              <strong>You have access</strong>
              <span>Continue where you left off.</span>
            </div>
          </div>
        ) : enrollment.upcoming ? (
          <div className={styles.priceRow}>
            <span className={styles.price}>Coming soon</span>
          </div>
        ) : isFree || price?.current ? (
          <div className={styles.priceRow}>
            <span className={styles.price}>{isFree ? "Free" : price?.current}</span>
            {price?.original && <span className={styles.priceOriginal}>{price.original}</span>}
          </div>
        ) : null}
        {!enrollment.enrolled &&
          !enrollment.upcoming &&
          price?.discountLabel &&
          (isFree || price.current) && (
            <div className={styles.discountLine}>
              <span>{price.discountLabel}</span>
              {price.endsAt && <DealCountdown endsAt={price.endsAt} />}
            </div>
          )}
      </div>

      <div className={styles.enrollActions}>
        {enrollment.upcoming && enrollment.waitlistEnabled ? (
          <div id="waitlist" className={styles.waitlist}>
            <WaitlistForm
              slug={slug}
              title={title}
              discountPercent={enrollment.wishlistDiscountPercent}
            />
          </div>
        ) : enrollment.upcoming ? (
          <span className={styles.disabledCta}>Enrollment opens soon</span>
        ) : (
          <Link className={styles.enrollPrimary} href={enrollment.href}>
            {enrollment.label}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}

        {!enrollment.enrolled && enrollment.hasFreePreview && (
          <Link className={styles.enrollSecondary} href={`/dashboard/courses/${slug}/learn`}>
            Try a free lesson
          </Link>
        )}
      </div>

      <ul className={styles.includedList}>
        {included.map((item) => (
          <li key={item}>
            <Check size={13} strokeWidth={3} aria-hidden="true" />
            <span>
              <BengaliText>{item}</BengaliText>
            </span>
          </li>
        ))}
      </ul>

      {showRefund && (
        <div className={styles.enrollNote}>
          <ShieldCheck size={15} aria-hidden="true" />
          <span>
            3-day refund window. <Link href="/refund">Read the policy</Link>
          </span>
        </div>
      )}
    </div>
  );
}

function CurriculumSection({
  curriculum,
  lessonCount,
  moduleCount,
}: {
  curriculum: ProgramDetailCurriculum;
  lessonCount: number;
  moduleCount: number;
}) {
  const totalModules = moduleCount || curriculum.modules.length;
  const countLabel =
    lessonCount > 0
      ? `${totalModules} modules · ${lessonCount} lessons`
      : `${totalModules} modules`;

  return (
    <section className={styles.section} id="curriculum">
      <SectionHeading
        eyebrow={curriculum.label ?? "CURRICULUM"}
        title={curriculum.title}
        description={countLabel}
      />

      <div className={styles.curriculumList}>
        {curriculum.modules.map((module, index) => (
          <details className={styles.module} key={module.title}>
            <summary className={styles.moduleSummary}>
              <span className={styles.moduleNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.moduleTitleRow}>
                <span className={styles.moduleTitle}>
                  <BengaliText>{module.title}</BengaliText>
                </span>
                {module.lessonCount && (
                  <span className={styles.moduleMeta}>
                    <BengaliText>{module.lessonCount}</BengaliText>
                  </span>
                )}
              </span>
              <ChevronDown className={styles.moduleChevron} size={17} aria-hidden="true" />
            </summary>
            <div className={styles.moduleBody}>
              {module.items.length > 0 && (
                <ul className={styles.lessonGrid}>
                  {module.items.map((item) => (
                    <li className={styles.lessonItem} key={item}>
                      <span className={styles.lessonDot} aria-hidden="true" />
                      <BengaliText>{item}</BengaliText>
                    </li>
                  ))}
                </ul>
              )}
              {module.capstone && (
                <p className={styles.capstone}>
                  <Check size={14} strokeWidth={3} aria-hidden="true" />
                  <BengaliText>Capstone: {module.capstone}</BengaliText>
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
      {curriculum.note && (
        <p className={styles.curriculumNote}>
          <BengaliText>{curriculum.note}</BengaliText>
        </p>
      )}
    </section>
  );
}

function ComparisonSection({ comparison }: { comparison: ComparisonSection }) {
  return (
    <section className={styles.section}>
      <SectionHeading eyebrow="COMPARISON" title={comparison.title} />
      <div className={styles.comparisonTable}>
        <div className={styles.comparisonHead}>
          <span>
            <BengaliText>{comparison.leftLabel}</BengaliText>
          </span>
          <span>
            <BengaliText>{comparison.rightLabel}</BengaliText>
          </span>
        </div>
        {comparison.rows.map((row) => (
          <div className={styles.comparisonRow} key={`${row.left}-${row.right}`}>
            <span>
              <BengaliText>{row.left}</BengaliText>
            </span>
            <span>
              <Check size={13} strokeWidth={3} aria-hidden="true" />
              <BengaliText>{row.right}</BengaliText>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection({ faqs }: { faqs: Faq[] }) {
  return (
    <section className={styles.section} id="faq">
      <SectionHeading eyebrow="FAQ" title="Common questions" />
      <div className={styles.faqList}>
        {faqs.map((faq) => (
          <details className={styles.faq} key={faq.q}>
            <summary className={styles.faqSummary}>
              <span>
                <BengaliText>{faq.q}</BengaliText>
              </span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <p>
              <BengaliText>{faq.a}</BengaliText>
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function RefundSection() {
  return (
    <section className={styles.section} id="refund">
      <SectionHeading
        eyebrow="REFUND POLICY"
        title="A simple 3-day refund window"
        description="If this course is not right for you, request a refund within 3 days of purchase. Approved refunds are returned in full."
      />
      <div className={styles.refundBox}>
        <ShieldCheck size={19} aria-hidden="true" />
        <div>
          <strong>Learn with confidence</strong>
          <p>
            <BengaliText>
              কেনার ৩ দিনের মধ্যে রিফান্ড দাবি করলে ১০০% টাকা ফেরত পাবেন। সম্পূর্ণ নীতিমালা দেখুন।
            </BengaliText>
          </p>
        </div>
        <Link href="/refund">Refund policy</Link>
      </div>
    </section>
  );
}

export function ProgramDetail({
  slug,
  badge,
  title,
  subtitle,
  description,
  heroPill,
  titleAccent,
  targetBand,
  rating,
  level,
  language,
  pace,
  access,
  stats,
  outcomes,
  features,
  featuresDesc,
  curriculum,
  comparison,
  faqs,
  books,
  certificate,
  price,
  isFree,
  media,
  lessonCount,
  moduleCount,
  enrollment,
  reviews,
  relatedPrograms,
  showRefund,
}: ProgramDetailProps) {
  const meta = [level, language, pace].filter((item): item is string => Boolean(item));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/programs">Programs</Link>
            <span aria-hidden="true">/</span>
            <span>{badge}</span>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrowRow}>
                <span className={styles.badge}>{badge}</span>
                {heroPill && (
                  <span className={styles.pill}>
                    <span className={styles.pillDot} aria-hidden="true" />
                    {heroPill}
                  </span>
                )}
              </div>

              <h1 className={styles.title}>
                <BengaliText>{title}</BengaliText>
                {titleAccent && (
                  <span className={styles.titleAccent}>
                    <BengaliText>{titleAccent}</BengaliText>
                  </span>
                )}
              </h1>
              {subtitle && (
                <p className={styles.subtitle}>
                  <BengaliText>{subtitle}</BengaliText>
                </p>
              )}
              <p className={styles.description}>
                <BengaliText>{description}</BengaliText>
              </p>

              {meta.length > 0 && (
                <div className={styles.meta}>
                  {meta.map((item) => (
                    <span key={item}>
                      <BengaliText>{item}</BengaliText>
                    </span>
                  ))}
                  {lessonCount > 0 && <span>{lessonCount} lessons</span>}
                  {moduleCount > 0 && <span>{moduleCount} modules</span>}
                </div>
              )}

              {rating && (
                <a className={styles.rating} href={reviews ? "#reviews" : undefined}>
                  <Stars value={rating.average} />
                  <strong>{rating.average.toFixed(1)}</strong>
                  <span>({rating.count} reviews)</span>
                </a>
              )}

              <div className={styles.heroActions}>
                <Link className={styles.heroPrimary} href={enrollment.href}>
                  {enrollment.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                {curriculum && (
                  <a className={styles.heroSecondary} href="#curriculum">
                    View curriculum
                  </a>
                )}
              </div>

              <div className={styles.trustLine}>
                <span>
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Instant access
                </span>
                <span>
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Self-paced
                </span>
                <span>
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Live support
                </span>
              </div>
            </div>

            <div className={styles.mediaWrap}>
              <div className={styles.mediaCard}>
                {media?.src ? (
                  <Image
                    src={media.src}
                    alt={media.alt}
                    fill
                    sizes="(max-width: 767px) 92vw, 430px"
                    className={media.fit === "contain" ? styles.mediaContain : styles.mediaCover}
                    priority
                  />
                ) : (
                  <div className={styles.mediaFallback}>
                    <GraduationCap size={36} aria-hidden="true" />
                    <span>{badge}</span>
                  </div>
                )}
                <span className={styles.mediaLabel}>
                  {media?.fit === "contain" ? "Course book" : "Program preview"}
                </span>
              </div>
              {targetBand && (
                <div className={styles.targetBand}>
                  <span>{targetBand.label}</span>
                  <strong>{targetBand.value}</strong>
                  <span>{targetBand.sub}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <section className={styles.facts} aria-label="Program facts">
          <div className={styles.factsInner}>
            {stats.map((stat) => (
              <div className={styles.fact} key={`${stat.value}-${stat.label}`}>
                <strong>{stat.value}</strong>
                <span>
                  <BengaliText>{stat.label}</BengaliText>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.mainSection}>
        <div className={styles.mainGrid}>
          <div className={styles.content}>
            {outcomes.length > 0 && (
              <section className={styles.section}>
                <SectionHeading
                  eyebrow="WHAT YOU WILL LEARN"
                  title="What this program helps you achieve"
                />
                <div className={styles.outcomeGrid}>
                  {outcomes.map((outcome) => (
                    <div className={styles.outcome} key={outcome.title}>
                      <span className={styles.outcomeCheck}>
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                      </span>
                      <div>
                        <p>
                          <BengaliText>{outcome.title}</BengaliText>
                        </p>
                        {outcome.desc && (
                          <span>
                            <BengaliText>{outcome.desc}</BengaliText>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {features && features.length > 0 && (
              <section className={styles.section}>
                <SectionHeading
                  eyebrow="WHAT'S INCLUDED"
                  title="Everything in this program"
                  description={featuresDesc}
                />
                <div className={styles.featureGrid}>
                  {features.map(({ icon: Icon, title: featureTitle, desc }) => (
                    <div className={styles.feature} key={featureTitle}>
                      <span className={styles.featureIcon}>
                        <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                      </span>
                      <h3>
                        <BengaliText>{featureTitle}</BengaliText>
                      </h3>
                      <p>
                        <BengaliText>{desc}</BengaliText>
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {curriculum && (
              <CurriculumSection
                curriculum={curriculum}
                lessonCount={lessonCount}
                moduleCount={moduleCount}
              />
            )}

            {books.length > 0 && (
              <section className={styles.section} id="book">
                <SectionHeading eyebrow="COURSE MATERIALS" title="Included with this program" />
                <div className={styles.bookGrid}>
                  {books.map((book) => (
                    <article className={styles.bookCard} key={book.title}>
                      <div className={styles.bookVisual}>
                        {book.image ? (
                          <Image
                            src={book.image}
                            alt={book.title}
                            width={160}
                            height={220}
                            sizes="160px"
                            className={styles.bookImage}
                          />
                        ) : (
                          <span className={styles.bookFallback}>
                            <BookOpen size={26} aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <div className={styles.bookCopy}>
                        {book.badge && <span className={styles.bookBadge}>{book.badge}</span>}
                        <h3>
                          <BengaliText>{book.title}</BengaliText>
                        </h3>
                        {book.description && (
                          <p>
                            <BengaliText>{book.description}</BengaliText>
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {comparison && <ComparisonSection comparison={comparison} />}

            {faqs && faqs.length > 0 && <FaqSection faqs={faqs} />}

            {showRefund && <RefundSection />}
          </div>

          <aside className={styles.aside}>
            <EnrollCard
              slug={slug}
              title={title}
              price={price}
              isFree={isFree}
              enrollment={enrollment}
              lessonCount={lessonCount}
              moduleCount={moduleCount}
              books={books}
              certificate={certificate}
              access={access}
              showRefund={showRefund}
            />
          </aside>
        </div>
      </section>

      {reviews && (
        <div className={styles.reviewsWrap}>
          <ReviewsSection
            courseId={reviews.courseId}
            reviews={reviews.items}
            totalReviews={reviews.total}
            averageRating={reviews.average}
            userReview={reviews.userReview}
          />
        </div>
      )}

      {relatedPrograms.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedInner}>
            <div className={styles.relatedHead}>
              <SectionHeading eyebrow="KEEP EXPLORING" title="Other programs you may like" />
              <Link href="/programs">
                View all programs <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.relatedGrid}>
              {relatedPrograms.slice(0, 3).map((program) => (
                <RelatedProgramCard key={program.slug} p={program} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
