"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, PlayCircle } from "lucide-react";

export function CourseEnrollButton({
  courseId,
  slug,
  enrolled,
  paid,
  block = false,
}: {
  courseId: string;
  slug: string;
  enrolled: boolean;
  paid: boolean;
  block?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const learnHref = `/dashboard/courses/${slug}/learn`;
  const baseClass =
    "inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white rounded-full transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60";
  const heroClass = "px-[30px] py-[15px] flex-1 sm:flex-none sm:min-w-[190px]";
  const blockClass = "block w-full py-[14px]";

  if (enrolled) {
    return (
      <Link
        href={learnHref}
        className={`${baseClass} ${block ? blockClass : heroClass}`}
        style={{ background: "var(--brand)" }}
      >
        <PlayCircle size={18} />
        Start learning
      </Link>
    );
  }

  if (paid) {
    return (
      <div className={`flex flex-col gap-2 ${block ? "" : "flex-1 sm:flex-none"}`}>
        <button
          type="button"
          onClick={enroll}
          disabled={submitting}
          className={`${baseClass} cursor-pointer ${block ? blockClass : heroClass}`}
          style={{ background: "var(--brand)" }}
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Redirecting…" : "Buy now"}
        </button>
        {note && (
          <span className="text-[12.5px] text-center sm:text-left" style={{ color: "var(--body)" }}>
            {note}
          </span>
        )}
      </div>
    );
  }

  async function enroll() {
    setNote(null);
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(paid ? `/programs/${slug}` : learnHref)}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "course", itemId: courseId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Enrollment failed");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      router.push(learnHref);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={enroll}
      disabled={submitting}
      className={`${baseClass} ${block ? blockClass : heroClass}`}
      style={{ background: "var(--brand)" }}
    >
      {submitting && <Loader2 size={16} className="animate-spin" />}
      {submitting ? "Enrolling…" : "Enroll free"}
    </button>
  );
}
