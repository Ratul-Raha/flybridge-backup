"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, PlayCircle, Award } from "lucide-react";
import { EmptyState } from "./ui";
import { BengaliText } from "@/components/bengali-text";

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
  progress: {
    percentage: number;
    completedQuizzes: number;
    totalQuizzes: number;
    passed: boolean;
  } | null;
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
        const prog = c.progress;
        const pct = prog?.percentage ?? 0;
        const quizDone = prog?.completedQuizzes ?? 0;
        const quizTotal = prog?.totalQuizzes ?? lessonCount;

        return (
          <Link
            key={c.id}
            href={`/dashboard/courses/${c.slug}/learn`}
            className="flex flex-col overflow-hidden rounded-lg border bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
            style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -14px rgba(18,32,67,0.12)" }}
          >
            {/* Thumbnail */}
            <div
              className="relative h-[178px] flex items-center justify-center overflow-hidden"
              style={{ background: "var(--brand-soft)" }}
            >
              {c.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(18,32,67,0.34), rgba(18,32,67,0.06) 42%)" }}
                  />
                </>
              ) : (
                <BookOpen size={32} className="text-white/50" />
              )}
              <span
                className="absolute left-3.5 top-3.5 font-mono text-[10px] font-semibold tracking-[0.4px] px-[11px] py-[5px] rounded-full"
                style={{ background: "rgba(255,255,255,0.92)", color: "var(--brand)" }}
              >
                {c.badge || "COURSE"}
              </span>
              {prog?.passed && (
                <span
                  className="absolute right-3.5 top-3.5 flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.06em] rounded-full px-3 py-[5px]"
                  style={{ background: "rgba(46,230,168,0.92)", color: "#fff" }}
                >
                  <Award size={12} />
                  PASSED
                </span>
              )}
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 gap-2.5 p-5">
              <h3 className="font-display text-[16.5px] font-semibold leading-[1.3]" style={{ color: "var(--ink)" }}>
                <BengaliText>{c.title}</BengaliText>
              </h3>
              <p className="text-[12.5px] leading-[1.55]" style={{ color: "var(--body)" }}>
                {c.subtitle || c.description}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-2 flex-wrap">
                {lessonCount > 0 && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    {lessonCount} lessons
                  </span>
                )}
              </div>

              {/* Stats footer */}
              <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                        Quizzes
                      </p>
                      <p className="font-mono text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                        {quizDone}/{quizTotal}
                      </p>
                    </div>
                    {quizDone > 0 && (
                      <div className="w-px h-8" style={{ background: "var(--line)" }} />
                    )}
                    {quizDone > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                          Avg Score
                        </p>
                        <p className="font-mono text-[13px] font-semibold" style={{ color: pct >= 60 ? "#2EE6A8" : "#F87171" }}>
                          {pct}%
                        </p>
                      </div>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center gap-[5px] text-[12.5px] font-medium shrink-0"
                    style={{ color: "var(--brand)" }}
                  >
                    <PlayCircle size={13} />
                    <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
