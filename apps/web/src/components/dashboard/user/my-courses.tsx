"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, PlayCircle } from "lucide-react";
import { EmptyState } from "./ui";

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
  modules: { title: string; lessons: { title: string; duration: string; videoUrl: string; pdfUrl: string }[] }[];
};

export function MyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me/courses", { cache: "no-store" });
      const data = await res.json();
      const enrolledIds = new Set<string>(data.enrolled ?? []);
      setEnrolled(enrolledIds);
      setCourses((data.courses ?? []).filter((c: Course) => enrolledIds.has(c.id)));
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title="You haven't enrolled in any courses yet"
        desc="Enrolling in a course unlocks step-by-step lessons, practice material and your personal progress tracking."
        action={
          <Link
            href="/dashboard/courses"
            className="inline-block rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            Browse all courses
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
      {courses.map((c) => {
        const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
        return (
          <div
            key={c.id}
            className="group rounded-lg border bg-white overflow-hidden flex flex-col transition-all duration-250 hover:translate-y-[-2px]"
            style={{ borderColor: "var(--line)", boxShadow: "0 4px 20px -8px rgba(18,32,67,0.1)" }}
          >
            {/* Thumbnail */}
            <div
              className="relative h-[150px] flex items-center justify-center overflow-hidden"
              style={{ background: "var(--brand-soft)" }}
            >
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <BookOpen size={32} style={{ color: "var(--brand)", opacity: 0.4 }} />
              )}
              <span
                className="absolute left-3 top-3 font-mono text-[10px] font-semibold tracking-[0.08em] rounded-full px-3 py-[5px]"
                style={{ background: "rgba(255,255,255,0.92)", color: "var(--brand)" }}
              >
                {c.badge || "COURSE"}
              </span>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 gap-2 p-5">
              <h3 className="font-display text-[16px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                {c.title}
              </h3>
              {c.subtitle && (
                <p className="text-[12.5px] leading-[1.5]" style={{ color: "var(--body)" }}>
                  {c.subtitle}
                </p>
              )}
              {lessonCount > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                  {lessonCount} lessons
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 mt-auto">
              <Link
                href={`/programs/${c.slug}/learn`}
                className="flex items-center justify-center gap-2 w-full rounded-full py-[11px] text-[13.5px] font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--brand)", color: "#fff" }}
              >
                <PlayCircle size={15} />
                Open Player
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
