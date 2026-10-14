"use client";

import { PlayCircle, HelpCircle } from "lucide-react";
import { Card } from "./card";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { BRAND, EMERALD, SKY } from "./lib";
import type {
  UsageRankedLesson,
  UsageRankedPage,
  UsageRankedQuiz,
} from "@/lib/admin/overview-analytics-types";

function pageLabel(path: string): string {
  const clean = path.replace(/^\/dashboard\/?/, "");
  if (!clean) return "Dashboard home";
  return clean
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment.length > 24 ? `${segment.slice(0, 22)}…` : segment.replace(/-/g, " "),
    )
    .join(" › ");
}

function Empty({ label }: { label: string }) {
  return (
    <p className="text-[13.5px] text-center py-12" style={{ color: "var(--body)" }}>
      {label}
    </p>
  );
}

export function TopPages({ pages, loading }: { pages: UsageRankedPage[]; loading?: boolean }) {
  return (
    <Card title="Top pages" subtitle="Most visited member pages">
      {loading ? (
        <InlineLoader label="Loading…" />
      ) : pages.length === 0 ? (
        <Empty label="No page views captured in this period yet." />
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
          {pages.map((page, i) => (
            <div key={page.path} className="flex items-center gap-3 py-2.5">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold shrink-0"
                style={{ background: "rgba(14,165,233,0.1)", color: SKY }}
              >
                {i + 1}
              </span>
              <p
                className="flex-1 min-w-0 truncate text-[13px] font-medium"
                style={{ color: "var(--ink)" }}
              >
                {pageLabel(page.path)}
              </p>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {page.views.toLocaleString()}
                </p>
                <p className="font-mono text-[10px]" style={{ color: "var(--body)" }}>
                  {page.members} members
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TopLessons({
  lessons,
  loading,
}: {
  lessons: UsageRankedLesson[];
  loading?: boolean;
}) {
  return (
    <Card title="Most viewed lessons" subtitle="Where members spend learning time">
      {loading ? (
        <InlineLoader label="Loading…" />
      ) : lessons.length === 0 ? (
        <Empty label="No lesson views captured in this period yet." />
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
          {lessons.map((lesson, i) => (
            <div
              key={`${lesson.courseSlug}-${lesson.moduleIndex}-${lesson.lessonIndex}`}
              className="flex items-center gap-3 py-2.5"
            >
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold shrink-0"
                style={{ background: "rgba(110,76,255,0.1)", color: BRAND }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="truncate text-[13px] font-medium flex items-center gap-1.5"
                  style={{ color: "var(--ink)" }}
                >
                  <PlayCircle size={13} style={{ color: BRAND }} className="shrink-0" />
                  {lesson.lessonTitle}
                </p>
                <p className="truncate text-[11.5px]" style={{ color: "var(--body)" }}>
                  {lesson.courseTitle} · {lesson.moduleTitle}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {lesson.views.toLocaleString()}
                </p>
                <p className="font-mono text-[10px]" style={{ color: "var(--body)" }}>
                  {lesson.members} members
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TopQuizzes({
  quizzes,
  loading,
}: {
  quizzes: UsageRankedQuiz[];
  loading?: boolean;
}) {
  return (
    <Card title="Most attempted quizzes" subtitle="Popular practice with average scores">
      {loading ? (
        <InlineLoader label="Loading…" />
      ) : quizzes.length === 0 ? (
        <Empty label="No quiz attempts captured in this period yet." />
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
          {quizzes.map((quiz, i) => (
            <div
              key={`${quiz.courseSlug}-${quiz.moduleIndex}-${quiz.lessonIndex}`}
              className="flex items-center gap-3 py-2.5"
            >
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold shrink-0"
                style={{ background: "rgba(16,185,129,0.1)", color: EMERALD }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="truncate text-[13px] font-medium flex items-center gap-1.5"
                  style={{ color: "var(--ink)" }}
                >
                  <HelpCircle size={13} style={{ color: EMERALD }} className="shrink-0" />
                  {quiz.lessonTitle}
                </p>
                <p className="truncate text-[11.5px]" style={{ color: "var(--body)" }}>
                  {quiz.courseTitle} · {quiz.moduleTitle}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {quiz.attempts.toLocaleString()}
                </p>
                <p className="font-mono text-[10px]" style={{ color: "var(--body)" }}>
                  avg {quiz.averageScore}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
