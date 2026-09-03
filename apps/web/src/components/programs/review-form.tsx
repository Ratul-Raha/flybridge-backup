"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";

type ExistingReview = {
  id: string;
  rating: number;
  text: string;
};

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
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: "var(--line)" }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(15,157,104,0.1)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0FA968" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Thank you for your review!</p>
        <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>Your feedback helps other students.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-6" style={{ borderColor: "var(--line)" }}>
      <h3 className="text-[15px] font-semibold mb-4" style={{ color: "var(--ink)" }}>
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>

      <div className="mb-4">
        <label className="text-[13px] font-medium mb-2 block" style={{ color: "var(--body)" }}>
          Your rating
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            const filled = value <= (hovered || rating);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className="w-6 h-6"
                  style={{
                    color: filled ? "#F59E0B" : "#DCE1EA",
                    fill: filled ? "#F59E0B" : "transparent",
                  }}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="text-[12px] font-medium ml-2" style={{ color: "var(--body)" }}>
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[13px] font-medium mb-2 block" style={{ color: "var(--body)" }}>
          Your review <span className="font-normal">(optional)</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience with this course..."
          maxLength={1000}
          rows={4}
          className="w-full rounded-lg border px-3.5 py-2.5 text-[13px] leading-[1.6] resize-none outline-none focus:border-[var(--brand-2)] transition-colors"
          style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#fff" }}
        />
        <div className="text-[11px] mt-1 text-right" style={{ color: "var(--body)" }}>
          {text.length}/1000
        </div>
      </div>

      {error && (
        <p className="text-[13px] mb-3" style={{ color: "#DC3545" }}>{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || rating < 1}
          className="inline-flex items-center justify-center gap-2 font-semibold text-[13px] text-white rounded-full px-5 py-2.5 transition-opacity disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {existingReview ? "Update review" : "Submit review"}
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="text-[13px] font-medium px-4 py-2.5 rounded-full transition-colors hover:bg-gray-100"
            style={{ color: "var(--body)" }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
