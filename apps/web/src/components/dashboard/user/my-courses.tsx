"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, PlayCircle } from "lucide-react";
import { EmptyState } from "./ui";

type Course = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  description: string;
  price: number;
  image: string | null;
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
      {courses.map((c) => (
        <Link
          key={c.id}
          href={`/programs/${c.slug}/learn`}
          className="group rounded-[24px] border bg-white p-6 flex flex-col gap-4 transition-all duration-250 hover:translate-y-[-2px]"
          style={{ borderColor: "var(--line)" }}
        >
          {c.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt={c.title} className="w-full h-[150px] rounded-xl object-cover" />
          )}
          <div className="flex flex-col gap-1.5 flex-1">
            <span
              className="w-fit font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              {c.badge || "Course"}
            </span>
            <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
              {c.title}
            </h3>
            <p className="text-[13.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
              {c.description}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-auto pt-2">
            <PlayCircle size={15} style={{ color: "var(--brand)" }} />
            <span className="text-[13px] font-semibold" style={{ color: "var(--brand)" }}>
              Continue learning
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
