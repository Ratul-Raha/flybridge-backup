"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  PlayCircle,
  CheckCircle2,
  HelpCircle,
  Award,
} from "lucide-react";
import { LessonQuiz } from "./lesson-quiz";

type Lesson = {
  title: string;
  duration: string;
  videoUrl: string;
  pdfUrl: string;
};

type Module = { title: string; lessons: Lesson[] };

type FlatLesson = {
  moduleTitle: string;
  title: string;
  duration: string;
  videoUrl: string;
  pdfUrl: string;
};

type GradeData = {
  percentage: number;
  grade: string;
  englishLevel: string;
  passed: boolean;
  totalQuizzes: number;
  completedQuizzes: number;
};

type QuizScoreEntry = {
  moduleIndex: number;
  lessonIndex: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  attempts: number;
};

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1]?.split("?")[0] || null;
      return u.searchParams.get("v") || null;
    }
  } catch {
    return null;
  }
  return null;
}

function VideoPlayer({ url, onEnded }: { url: string; onEnded?: () => void }) {
  const ytId = useMemo(() => getYouTubeId(url), [url]);

  if (ytId) {
    return (
      <div className="w-full aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={() => onEnded?.()}
        />
      </div>
    );
  }

  return (
    <video
      key={url}
      controls
      playsInline
      className="w-full aspect-video"
      onEnded={onEnded}
    >
      <source src={url} />
    </video>
  );
}

export function LessonPlayer({
  course,
  lessons,
  initialIndex,
}: {
  course: {
    id: string;
    slug: string;
    title: string;
    image: string | null;
    modules: Module[];
  };
  lessons: FlatLesson[];
  initialIndex: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(initialIndex);
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"video" | "quiz">("video");
  const [grade, setGrade] = useState<GradeData | null>(null);
  const [quizScores, setQuizScores] = useState<QuizScoreEntry[]>([]);

  const current = lessons[index];

  // Derive moduleIndex and lessonIndex from flat index
  const { moduleIndex, lessonIndex } = useMemo(() => {
    let remaining = index;
    for (let mi = 0; mi < course.modules.length; mi++) {
      const mod = course.modules[mi];
      if (remaining < mod.lessons.length) {
        return { moduleIndex: mi, lessonIndex: remaining };
      }
      remaining -= mod.lessons.length;
    }
    return { moduleIndex: 0, lessonIndex: 0 };
  }, [index, course.modules]);

  // Load progress from server
  useEffect(() => {
    fetch(`/api/courses/${course.id}/progress`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setWatched(new Set<number>(data.watchedLessons ?? []));
          setGrade(data.grade ?? null);
          setQuizScores(data.quizScores ?? []);
        }
      })
      .catch(() => {});
  }, [course.id]);

  const goTo = (i: number) => {
    if (i < 0 || i >= lessons.length) return;
    setIndex(i);
    setTab("video");
    router.replace(`/programs/${course.slug}/learn?lesson=${i}`);
  };

  const markWatched = useCallback((i: number) => {
    if (lessons[i]?.videoUrl) {
      setWatched((prev) => {
        if (prev.has(i)) return prev;
        const next = new Set(prev);
        next.add(i);
        // Persist to server
        fetch(`/api/courses/${course.id}/progress`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchedLesson: i }),
        }).catch(() => {});
        return next;
      });
    }
  }, [lessons, course.id]);

  const toggleModule = (title: string) =>
    setOpenModules((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));

  const totalLessons = lessons.length;
  const watchedCount = watched.size;
  const progressPct = totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B1220" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-[#0B1220]/95 backdrop-blur" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/courses"
              className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-white/10"
              style={{ color: "#E8ECF4", borderColor: "rgba(255,255,255,0.16)" }}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">My Courses</span>
            </Link>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40 truncate">
                {course.title}
              </p>
              {current && (
                <p className="text-[13.5px] font-medium text-white/90 truncate">
                  Lesson {index + 1} of {lessons.length} · {current.title}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-[5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: grade?.passed
                      ? "linear-gradient(90deg, #2EE6A8, #34D399)"
                      : "linear-gradient(90deg, #6B4CE0, #A78BFA)",
                  }}
                />
              </div>
              <span className="font-mono text-[10px] font-semibold text-white/60">{progressPct}%</span>
            </div>
            <Link
              href={`/programs/${course.slug}/certificate`}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full border px-3 py-[5px] transition-colors hover:bg-white/10"
              style={{ color: grade?.passed ? "#2EE6A8" : "#E8ECF4", borderColor: "rgba(255,255,255,0.16)" }}
            >
              <Award size={13} />
              <span className="hidden sm:inline">Certificate</span>
            </Link>
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] rounded-full px-3 py-[6px]"
              style={{ background: "rgba(46,230,168,0.14)", color: "#2EE6A8" }}
            >
              Player
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1320px] w-full mx-auto">
        {/* Sidebar */}
        <aside className="lg:w-[340px] lg:shrink-0 lg:border-r flex flex-col lg:max-h-[calc(100vh-64px)] lg:sticky lg:top-16 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Progress summary */}
          <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                Course Progress
              </span>
              <span className="font-mono text-[12px] font-semibold" style={{ color: grade?.passed ? "#2EE6A8" : "#A78BFA" }}>
                {progressPct}%
              </span>
            </div>
            <div className="w-full h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: grade?.passed
                    ? "linear-gradient(90deg, #2EE6A8, #34D399)"
                    : "linear-gradient(90deg, #6B4CE0, #A78BFA)",
                }}
              />
            </div>
            <p className="text-[11px] mt-1.5 text-white/40">
              {watchedCount}/{totalLessons} lessons watched
              {grade && grade.completedQuizzes > 0 && (
                <> · Avg: {grade.percentage}%</>
              )}
            </p>
          </div>

          <div className="px-4 py-4 flex flex-col gap-1">
            {course.modules.map((m, mi) => {
              const open = openModules[m.title] ?? true;
              return (
                <div key={`${mi}-${m.title}`} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggleModule(m.title)}
                    className="flex items-center gap-2 px-2 py-2.5 text-left rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {open ? (
                      <ChevronDown size={14} style={{ color: "#8B93A7" }} />
                    ) : (
                      <ChevronRight size={14} style={{ color: "#8B93A7" }} />
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                      Module {mi + 1}
                    </span>
                    <span className="text-[13px] font-medium text-white/85 truncate">{m.title}</span>
                  </button>
                  {open && (
                    <div className="flex flex-col gap-0.5 ml-[22px]">
                      {m.lessons.map((l, li) => {
                        const globalIndex = course.modules
                          .slice(0, mi)
                          .reduce((n, x) => n + x.lessons.length, 0) + li;
                        const isCurrent = globalIndex === index;
                        const isWatched = watched.has(globalIndex);
                        const quizScore = quizScores.find(
                          (s) => s.moduleIndex === mi && s.lessonIndex === li
                        );
                        return (
                          <button
                            key={`${li}-${l.title}`}
                            type="button"
                            onClick={() => goTo(globalIndex)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors"
                            style={
                              isCurrent
                                ? { background: "rgba(46,230,168,0.12)" }
                                : { background: "transparent" }
                            }
                          >
                            {isWatched ? (
                              <CheckCircle2 size={15} style={{ color: "#2EE6A8" }} />
                            ) : (
                              <PlayCircle
                                size={15}
                                style={{ color: isCurrent ? "#2EE6A8" : "#5B6478" }}
                              />
                            )}
                            <span
                              className="text-[13px] leading-snug flex-1 min-w-0"
                              style={{
                                color: isCurrent ? "#E8ECF4" : isWatched ? "#9FD7BE" : "#8B93A7",
                                fontWeight: isCurrent ? 600 : 400,
                              }}
                            >
                              {l.title}
                            </span>
                            {quizScore && (
                              <span
                                className="font-mono text-[10px] font-semibold shrink-0 rounded-full px-2 py-0.5"
                                style={{
                                  background: quizScore.score >= 60
                                    ? "rgba(46,230,168,0.15)"
                                    : "rgba(248,113,113,0.15)",
                                  color: quizScore.score >= 60 ? "#2EE6A8" : "#F87171",
                                }}
                              >
                                {quizScore.score}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {course.modules.length === 0 && (
              <p className="text-[13px] px-2 py-4" style={{ color: "#8B93A7" }}>
                No lessons published yet.
              </p>
            )}
          </div>
        </aside>

        {/* Player */}
        <main className="flex-1 min-w-0 flex flex-col">
          {current ? (
            <>
              <div className="px-4 sm:px-8 py-6 flex-1 flex flex-col">
                <h1 className="font-display text-[19px] sm:text-[22px] font-semibold text-white/95 leading-snug">
                  {current.title}
                </h1>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] mt-1" style={{ color: "#8B93A7" }}>
                  {current.moduleTitle}
                  {current.duration ? ` · ${current.duration}` : ""}
                </p>

                {/* Video / Quiz tabs */}
                <div className="flex gap-1 mt-4 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <button
                    type="button"
                    onClick={() => setTab("video")}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
                    style={
                      tab === "video"
                        ? { background: "rgba(255,255,255,0.08)", color: "#E8ECF4" }
                        : { color: "#5B6478" }
                    }
                  >
                    <PlayCircle size={14} />
                    Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("quiz")}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
                    style={
                      tab === "quiz"
                        ? { background: "rgba(107,76,224,0.15)", color: "#A78BFA" }
                        : { color: "#5B6478" }
                    }
                  >
                    <HelpCircle size={14} />
                    Quiz
                  </button>
                </div>

                {tab === "video" ? (
                  <>
                    {current.videoUrl ? (
                      <div className="mt-5 rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.1)", background: "#000" }}>
                        <VideoPlayer url={current.videoUrl} onEnded={() => markWatched(index)} />
                      </div>
                    ) : (
                      <div
                        className="mt-5 rounded-2xl border flex flex-col items-center justify-center gap-3 py-20 text-center px-6"
                        style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
                      >
                        <PlayCircle size={34} style={{ color: "#5B6478" }} />
                        <p className="text-[14px]" style={{ color: "#8B93A7" }}>
                          This lesson has no video yet.
                        </p>
                      </div>
                    )}

                    {current.pdfUrl && (
                      <a
                        href={current.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 self-start inline-flex items-center gap-2 rounded-full border px-5 py-[10px] text-[13px] font-medium transition-colors hover:bg-white/5"
                        style={{ color: "#E8ECF4", borderColor: "rgba(255,255,255,0.16)" }}
                      >
                        <FileText size={14} />
                        Open lesson notes (PDF)
                      </a>
                    )}
                  </>
                ) : (
                  <div className="mt-5">
                    <LessonQuiz
                      courseId={course.id}
                      moduleIndex={moduleIndex}
                      lessonIndex={lessonIndex}
                      onScoreUpdate={(entry) => {
                        setQuizScores((prev) => {
                          const idx = prev.findIndex(
                            (s) => s.moduleIndex === entry.moduleIndex && s.lessonIndex === entry.lessonIndex
                          );
                          if (idx >= 0) {
                            const next = [...prev];
                            next[idx] = { ...entry, attempts: (next[idx].attempts ?? 1) + 1 };
                            return next;
                          }
                          return [...prev, { ...entry, attempts: 1 }];
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
              <p className="text-[15px]" style={{ color: "#8B93A7" }}>
                No lessons in this course yet.
              </p>
              <Link
                href="/programs"
                className="rounded-full text-white text-[13.5px] font-medium px-5 py-[10px] hover:opacity-90 transition-opacity"
                style={{ background: "var(--brand)" }}
              >
                Browse programs
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
