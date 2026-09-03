"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Star } from "lucide-react";
import { BengaliText } from "../bengali-text";

export type DbCourse = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  level: string;
  upcoming: boolean;
  averageRating?: number;
  modules: { title: string; lessons: { title: string }[] }[];
};

export function DbCourseCard({ course }: { course: DbCourse }) {
  const [imgError, setImgError] = useState(false);
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const isFree = course.price <= 0;

  const badge = (
    <span
      className="font-mono text-[10px] font-semibold tracking-[0.4px] px-[11px] py-[5px] rounded-full inline-block"
      style={{ background: "rgba(255,255,255,0.92)", color: "var(--brand)" }}
    >
      {course.badge || "COURSE"}
    </span>
  );

  const media = (
    <div
      className="relative h-[178px] flex items-center justify-center overflow-hidden"
      style={{ background: "var(--brand-soft)" }}
    >
      {course.image && !imgError ? (
        <>
          <img
            src={course.image}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(18,32,67,0.34), rgba(18,32,67,0.06) 42%)" }}
          />
        </>
      ) : (
        <BookOpen size={32} className="text-white/50" />
      )}
      <span className="absolute left-3.5 top-3.5">{badge}</span>
      {course.upcoming && (
        <span
          className="absolute right-3.5 top-3.5 font-mono text-[10px] font-semibold tracking-[0.4px] px-[9px] py-[5px] rounded-full"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          UPCOMING
        </span>
      )}
    </div>
  );

  const meta: string[] = [];
  if (course.level) meta.push(course.level);
  if (lessonCount > 0) meta.push(`${lessonCount} lessons`);

  const footer = (
    <div className="flex items-end justify-between gap-3">
      <div>
        {course.upcoming ? (
          <div
            className="font-mono text-[10px] font-semibold tracking-[0.3px]"
            style={{ color: "var(--brand)" }}
          >
            COMING SOON
          </div>
        ) : isFree ? (
          <div
            className="font-mono text-[10px] font-semibold tracking-[0.3px]"
            style={{ color: "var(--brand)" }}
          >
            FREE
          </div>
        ) : (
          <>
            <div
              className="font-mono text-[10px] font-medium tracking-[0.3px]"
              style={{ color: "var(--brand-2)" }}
            >
              INTRO OFFER
            </div>
            <div
              className="font-display font-bold leading-none mt-[4px]"
              style={{ fontSize: "23px", color: "var(--ink)" }}
            >
              {course.currency} {course.price.toLocaleString()}
            </div>
          </>
        )}
      </div>
      <span
        className="inline-flex items-center gap-[5px] text-[12.5px] font-medium"
        style={{ color: "var(--brand)" }}
      >
        {course.upcoming ? "View details" : "Enroll now"}
        <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
          <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );

  return (
    <Link
      href={`/programs/${course.slug}`}
      className="flex flex-col overflow-hidden rounded-lg border bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -14px rgba(18,32,67,0.12)" }}
    >
      {media}
      <div className="flex flex-col flex-1 gap-2.5 p-5">
        <h3 className="font-display text-[16.5px] font-semibold leading-[1.3]" style={{ color: "var(--ink)" }}>
          <BengaliText>{course.title}</BengaliText>
        </h3>
        <p className="text-[12.5px] leading-[1.55]" style={{ color: "var(--body)" }}>
          {course.subtitle || course.description}
        </p>
        {meta.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {meta.map((m) => (
              <span
                key={m}
                className="font-mono text-[10px] uppercase tracking-[0.08em]"
                style={{ color: "var(--body)" }}
              >
                {m}
              </span>
            ))}
          </div>
        )}
        {course.averageRating && course.averageRating > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-[2px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-3 h-3"
                  style={{
                    color: i < Math.round(course.averageRating!) ? "#F59E0B" : "#DCE1EA",
                    fill: i < Math.round(course.averageRating!) ? "#F59E0B" : "transparent",
                  }}
                  strokeWidth={1.5}
                />
              ))}
            </span>
            <span className="text-[11px] font-medium" style={{ color: "var(--ink)" }}>
              {course.averageRating!.toFixed(1)}
            </span>
          </div>
        )}
        <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--line)" }}>
          {footer}
        </div>
      </div>
    </Link>
  );
}
