"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { programs } from "@/lib/programs";
import { useAuth } from "@/lib/auth/auth-context";

type Course = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  modules: { title: string; lessons: { title: string }[] }[];
};

export function AllCourses() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me/courses", { cache: "no-store" });
      const data = await res.json();
      setCourses(data.courses ?? []);
      setEnrolled(new Set<string>(data.enrolled ?? []));
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const enroll = async (course: Course) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/dashboard/courses/${course.slug}/learn`)}`);
      return;
    }
    setEnrolling(course.id);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "course", itemId: course.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Enrollment failed");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setEnrolled((prev) => new Set(prev).add(course.id));
      router.push(`/dashboard/courses/${course.slug}/learn`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {programs.map((p) => (
          <Link
            key={p.slug}
            href={`/programs/${p.slug}`}
            className="group rounded-[24px] border bg-white p-6 flex flex-col gap-4 transition-all duration-250 hover:translate-y-[-2px]"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="rounded-2xl px-3.5 py-2 w-fit" style={{ background: p.bg, color: p.badgeColor }}>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
                {p.badge}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                {p.title}
              </h3>
              <p className="text-[13.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                {p.desc}
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                style={
                  p.upcoming
                    ? { background: "var(--bg-soft)", color: "var(--body)" }
                    : { background: "var(--brand-soft)", color: "var(--brand)" }
                }
              >
                {p.upcoming ? "Coming soon" : "Enroll now"}
              </span>
              <ArrowUpRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
                style={{ color: "var(--body)" }}
              />
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-[12.5px] rounded-xl border px-4 py-3" style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}>
          {error}
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
      {courses.map((c) => {
        const isEnrolled = enrolled.has(c.id);
        const isFree = c.price <= 0;
        const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
        return (
          <Link
            key={c.id}
            href={`/programs/${c.slug}`}
            className="group rounded-[24px] border bg-white p-6 flex flex-col gap-4 transition-all duration-250 hover:translate-y-[-2px]"
            style={{ borderColor: "var(--line)" }}
          >
            {c.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image} alt={c.title} className="w-full h-[150px] rounded-xl object-cover" />
            )}
            <div className="rounded-2xl px-3.5 py-2 w-fit" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
                {c.badge || "Course"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                {c.title}
              </h3>
              <p className="text-[13.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                {c.subtitle || c.description}
              </p>
              {lessonCount > 0 && (
                <p className="font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                  {lessonCount} lessons
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
              {isEnrolled ? (
                <span
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                  style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                >
                  Start learning
                </span>
              ) : isFree ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    enroll(c);
                  }}
                  disabled={enrolling === c.id}
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px] transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                >
                  {enrolling === c.id ? "Enrolling…" : "Enroll free"}
                </button>
              ) : (
                <span
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                  style={{ background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }}
                >
                  {c.currency} {c.price}
                </span>
              )}
              <ArrowUpRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
                style={{ color: "var(--body)" }}
              />
            </div>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
