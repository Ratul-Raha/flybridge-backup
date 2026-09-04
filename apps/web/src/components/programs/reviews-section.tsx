"use client";

import { useRouter } from "next/navigation";
import { BadgeCheck, MessageSquarePlus, Star, ThumbsUp } from "lucide-react";
import { ReviewForm } from "./review-form";

export type ReviewItem = {
  id: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  text: string;
  date: string;
  verified?: boolean;
  helpful?: number;
};

type ReviewsSectionProps = {
  courseId?: string;
  reviews: ReviewItem[];
  totalReviews: number;
  averageRating: number;
  userReview?: { id: string; rating: number; text: string } | null;
};

const cardStyle = {
  borderRadius: 18,
  border: "1px solid var(--line)",
  background: "#fff",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 28px -16px rgba(16,24,40,0.12)",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#10B981,#067A4F)",
  "linear-gradient(135deg,#2563EB,#1E40AF)",
  "linear-gradient(135deg,#8B6BF0,#5B3FD6)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#EF6C7D,#D9415C)",
  "linear-gradient(135deg,#0EA5E9,#0369A1)",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-4 h-4 shrink-0"
          style={{
            width: size,
            height: size,
            color: i < filled ? "#F59E0B" : "#E2E6EF",
            fill: i < filled ? "#F59E0B" : "transparent",
          }}
          strokeWidth={1.75}
        />
      ))}
    </span>
  );
}

function RatingSummary({
  average,
  total,
  reviews,
}: {
  average: number;
  total: number;
  reviews: ReviewItem[];
}) {
  return (
    <div
      className="p-6 sm:p-7"
      style={{ ...cardStyle, background: "linear-gradient(180deg,#fff 0%,#FBFDFC 100%)" }}
    >
      <div className="flex items-end gap-2">
        <span
          className="font-display font-semibold tracking-[-0.02em] leading-none text-[46px]"
          style={{ color: "var(--ink)" }}
        >
          {average.toFixed(1)}
        </span>
        <span className="text-[13px] font-medium pb-1.5" style={{ color: "var(--body)" }}>
          out of 5
        </span>
      </div>
      <div className="mt-3">
        <Stars value={average} size={16} />
      </div>
      <p className="text-[12.5px] mt-2" style={{ color: "var(--body)" }}>
        Based on {total} review{total === 1 ? "" : "s"}
      </p>

      <div className="my-6 h-px" style={{ background: "var(--line)" }} />

      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => Math.round(r.rating) === star).length;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2.5">
              <span
                className="text-[12px] font-semibold w-4 text-right tabular-nums"
                style={{ color: "var(--ink)" }}
              >
                {star}
              </span>
              <Star
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "#F59E0B", fill: "#F59E0B" }}
                strokeWidth={1.5}
              />
              <div
                className="flex-1 h-[7px] rounded-full overflow-hidden"
                style={{ background: "#EEF1F6" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg,#FBBF24,#F59E0B)" }}
                />
              </div>
              <span
                className="text-[12px] w-5 text-right tabular-nums"
                style={{ color: "var(--body)" }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerifiedTag() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-[3px] rounded-full"
      style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
    >
      <BadgeCheck className="w-3 h-3" strokeWidth={2} />
      Verified
    </span>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const initials = initialsOf(review.userName);
  const gradientIndex =
    [...initials].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;

  return (
    <article
      className="p-5 sm:p-6 transition-shadow duration-200 hover:shadow-[0_18px_40px_-22px_rgba(16,24,40,0.22)]"
      style={cardStyle}
    >
      <div className="flex items-start gap-3">
        {review.userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={review.userAvatar}
            alt={review.userName}
            className="w-[44px] h-[44px] rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[14px] font-semibold text-white shrink-0"
            style={{
              background: AVATAR_GRADIENTS[gradientIndex],
              boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)",
            }}
          >
            {initials}
          </span>
        )}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[14.5px] font-semibold leading-tight"
              style={{ color: "var(--ink)" }}
            >
              {review.userName}
            </span>
            {review.verified && <VerifiedTag />}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] font-semibold"
              style={{ background: "#FFF7E6", color: "#B45309" }}
            >
              <Star
                className="w-3 h-3"
                style={{ color: "#F59E0B", fill: "#F59E0B" }}
                strokeWidth={1.5}
              />
              {review.rating}.0
            </span>
            <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
              {review.date}
            </span>
          </div>
        </div>
      </div>

      {review.text && (
        <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: "var(--body)" }}>
          {review.text}
        </p>
      )}

      {review.helpful ? (
        <div
          className="mt-4 w-fit inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3 py-1.5"
          style={{ background: "#F2F4F8", color: "var(--body)" }}
        >
          <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.75} />
          {review.helpful} found this helpful
        </div>
      ) : null}
    </article>
  );
}

function EmptyState({ hasForm }: { hasForm: boolean }) {
  return (
    <div
      className="rounded-2xl p-10 sm:p-14 text-center border border-dashed"
      style={{ borderColor: "var(--line)", background: "rgba(250,250,248,0.6)" }}
    >
      <div
        className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
      >
        <MessageSquarePlus className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
        No reviews yet
      </h3>
      <p
        className="text-[13.5px] mt-1.5 max-w-[360px] mx-auto leading-relaxed"
        style={{ color: "var(--body)" }}
      >
        {hasForm
          ? "Be the first to share your experience and help other students choose with confidence."
          : "Reviews will appear here once students share their experience."}
      </p>
    </div>
  );
}

export function ReviewsSection({
  courseId,
  reviews,
  totalReviews,
  averageRating,
  userReview,
}: ReviewsSectionProps) {
  const router = useRouter();
  const hasReviews = reviews.length > 0;

  const desc = hasReviews
    ? `Showing ${totalReviews} review${totalReviews === 1 ? "" : "s"} from real students`
    : "Be the first to review this course.";

  const form = courseId ? (
    <ReviewForm
      courseId={courseId}
      existingReview={userReview}
      onSuccess={() => router.refresh()}
    />
  ) : null;

  return (
    <section id="reviews" className="px-[clamp(20px,4.5vw,56px)] pb-[70px] max-w-[1320px] mx-auto">
      <div className="mb-7">
        <div
          className="font-mono text-[11.5px] font-medium tracking-[0.35em] mb-[10px]"
          style={{ color: "var(--brand-2)" }}
        >
          RATINGS &amp; REVIEWS
        </div>
        <h2
          className="font-semibold tracking-[-0.01em]"
          style={{ fontSize: "clamp(24px,2.6vw,30px)", color: "var(--ink)" }}
        >
          What students say
        </h2>
        {desc && (
          <p className="text-[15px] mt-2 max-w-[560px]" style={{ color: "var(--body)" }}>
            {desc}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-6 lg:sticky lg:top-24">
          {hasReviews && (
            <RatingSummary average={averageRating} total={totalReviews} reviews={reviews} />
          )}
          {form}
        </aside>

        <div className="space-y-4">
          {hasReviews ? (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <EmptyState hasForm={Boolean(form)} />
          )}
        </div>
      </div>
    </section>
  );
}
