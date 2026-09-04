"use client";

import { useState } from "react";
import { Loader2, PenLine, Star, Trash2 } from "lucide-react";

type ExistingReview = {
  id: string;
  rating: number;
  text: string;
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const RATING_HINTS = [
  "",
  "Not useful at all",
  "Left me wanting more",
  "Solid but room to grow",
  "Really delivered",
  "Surpassed expectations",
];

const cardStyle = {
  borderRadius: 18,
  border: "1px solid var(--line)",
  background: "#fff",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 28px -16px rgba(16,24,40,0.12)",
};

function redirectToLogin() {
  const next = encodeURIComponent(`${window.location.pathname}#reviews`);
  window.location.assign(`/login?next=${next}&source=course`);
}

export function ReviewForm({
  courseId,
  existingReview,
  onSuccess,
}: {
  courseId: string;
  existingReview?: ExistingReview | null;
  onSuccess?: () => void;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState(existingReview?.text ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text }),
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!existingReview) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete review");
      }
      setRating(0);
      setText("");
      setSubmitted(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (submitted && !existingReview) {
    return (
      <div className="fb-pop-up p-7 text-center" style={cardStyle}>
        <div
          className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: "#E7F8F0", color: "#0FA968" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          Thank you for your review!
        </p>
        <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--body)" }}>
          Your feedback helps other students choose with confidence.
        </p>
      </div>
    );
  }

  const activeStar = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-7" style={cardStyle}>
      <div className="flex items-center gap-3 mb-5">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
        >
          <PenLine className="w-[17px] h-[17px]" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-[15px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {existingReview ? "Update your review" : "Share your experience"}
          </h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
            How was this course? It takes a minute.
          </p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            Your rating
          </label>
          <span
            className="text-[12px] font-medium"
            style={{ color: rating ? "#B45309" : "var(--body)" }}
          >
            {rating ? RATING_LABELS[rating] : "Tap a star to rate"}
          </span>
        </div>
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const filled = value <= activeStar;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`Rate ${value} of 5`}
                aria-pressed={rating === value}
                className="p-1 rounded-lg transition-transform duration-150 active:scale-90"
                style={{ transform: hovered === value ? "scale(1.15)" : "scale(1)" }}
              >
                <Star
                  className="w-7 h-7 transition-colors duration-150"
                  strokeWidth={1.5}
                  style={{
                    color: filled ? "#F59E0B" : "#DFE3EC",
                    fill: filled ? "#F59E0B" : "transparent",
                    filter: filled ? "drop-shadow(0 3px 8px rgba(245,158,11,0.35))" : "none",
                  }}
                />
              </button>
            );
          })}
        </div>
        {rating > 0 && (
          <p className="text-[11.5px] mt-1.5" style={{ color: "var(--body)" }}>
            {RATING_HINTS[rating]}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
          Your review{" "}
          <span className="font-normal" style={{ color: "var(--body)" }}>
            · optional
          </span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share what helped you most — clear writing, templates, live support..."
          maxLength={1000}
          rows={4}
          className="mt-2 w-full rounded-xl border px-4 py-3 text-[13.5px] leading-[1.65] resize-none outline-none transition-colors focus:border-[#F59E0B]"
          style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--bg)" }}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            1000 characters max
          </span>
          <span
            className="text-[11.5px] tabular-nums font-medium"
            style={{ color: text.length > 900 ? "#B45309" : "var(--body)" }}
          >
            {text.length}/1000
          </span>
        </div>
      </div>

      {error && (
        <p className="text-[13px] mb-3" style={{ color: "#DC3545" }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || rating < 1}
          className="inline-flex items-center justify-center gap-2 text-[13.5px] font-semibold text-white rounded-full px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{
            background: "var(--brand)",
            boxShadow: "0 12px 26px -14px rgba(15,169,104,0.7)",
          }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <Star
            className="w-4 h-4"
            style={{ color: "#fff", fill: rating > 0 ? "#fff" : "transparent" }}
            strokeWidth={1.75}
          />
          {existingReview ? "Update review" : "Submit review"}
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2.5 rounded-full transition-colors hover:bg-[#FDECEC]"
            style={{ color: "#DC3545" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
