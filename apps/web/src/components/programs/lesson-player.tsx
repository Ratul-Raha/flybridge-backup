"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  PlayCircle,
  CheckCircle2,
  HelpCircle,
  Award,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { LessonQuiz } from "./lesson-quiz";
import { BengaliText } from "../bengali-text";

type Lesson = {
  title: string;
  duration: string;
  videoUrl: string;
  pdfUrl: string;
  content: string;
};

type Module = { title: string; lessons: Lesson[] };

type FlatLesson = {
  moduleTitle: string;
  title: string;
  duration: string;
  videoUrl: string;
  pdfUrl: string;
  content: string;
};

type GradeData = {
  percentage: number;
  grade: string;
  performance?: string;
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
    books: { title: string; description: string; pdfUrl: string }[];
  };
  lessons: FlatLesson[];
  initialIndex: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(initialIndex);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"lesson" | "quiz">("lesson");
  const [grade, setGrade] = useState<GradeData | null>(null);
  const [quizScores, setQuizScores] = useState<QuizScoreEntry[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const current = lessons[index];

  const completedLessons = useMemo(() => {
    const completed = new Set<number>();
    let offset = 0;
    for (let mi = 0; mi < course.modules.length; mi++) {
      const mod = course.modules[mi];
      for (let li = 0; li < mod.lessons.length; li++) {
        const entry = quizScores.find(
          (s) => s.moduleIndex === mi && s.lessonIndex === li
        );
        if (entry && entry.score >= 60) {
          completed.add(offset + li);
        }
      }
      offset += mod.lessons.length;
    }
    return completed;
  }, [quizScores, course.modules]);

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

  useEffect(() => {
    fetch(`/api/courses/${course.id}/progress`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setGrade(data.grade ?? null);
          setQuizScores(data.quizScores ?? []);
        }
      })
      .catch(() => {});
  }, [course.id]);

  const goTo = (i: number) => {
    if (i < 0 || i >= lessons.length) return;
    setIndex(i);
    setTab("lesson");
    router.replace(`/dashboard/courses/${course.slug}/learn?lesson=${i}`);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleModule = (title: string) =>
    setOpenModules((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));

  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((p) => !p)}
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-black/5 lg:hidden"
              style={{ color: "var(--ink)" }}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div className="flex items-center gap-2 text-[13px] min-w-0">
              <Link href="/dashboard" className="shrink-0 font-medium transition-colors hover:opacity-70" style={{ color: "var(--body)" }}>
                Dashboard
              </Link>
              <ChevronRight size={12} style={{ color: "var(--body)" }} />
              <Link href="/dashboard/courses/mine" className="shrink-0 font-medium transition-colors hover:opacity-70" style={{ color: "var(--body)" }}>
                My Courses
              </Link>
              <ChevronRight size={12} style={{ color: "var(--body)" }} />
              <span className="font-semibold truncate" style={{ color: "var(--ink)" }}>
                <BengaliText>{course.title}</BengaliText>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--brand-soft, rgba(107,76,224,0.1))" }}>
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
              <span className="font-mono text-[10px] font-semibold" style={{ color: "var(--body)" }}>{progressPct}%</span>
            </div>
            <Link
              href={`/dashboard/courses/${course.slug}/certificate`}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full border px-3 py-[5px] transition-colors hover:bg-black/5"
              style={{ color: grade?.passed ? "#16a34a" : "var(--ink)", borderColor: "var(--line)" }}
            >
              <Award size={13} />
              <span className="hidden sm:inline">Certificate</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-14 left-0 z-30 lg:z-auto
            w-[300px] lg:w-[320px] lg:shrink-0
            h-[calc(100vh-56px)] lg:h-auto
            border-r bg-white overflow-y-auto
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          style={{ borderColor: "var(--line)" }}
        >
          {/* Progress summary */}
          <div className="px-4 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                Course Progress
              </span>
              <span className="font-mono text-[12px] font-semibold" style={{ color: grade?.passed ? "#16a34a" : "var(--brand)" }}>
                {progressPct}%
              </span>
            </div>
            <div className="w-full h-[4px] rounded-full overflow-hidden" style={{ background: "var(--brand-soft, rgba(107,76,224,0.1))" }}>
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
            <p className="text-[11px] mt-1.5" style={{ color: "var(--body)" }}>
              {completedCount}/{totalLessons} lessons completed
              {grade && grade.completedQuizzes > 0 && (
                <>
                  {" "}
                  · Avg: {grade.percentage}%
                  {grade.performance ? ` · ${grade.performance}` : ""}
                </>
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
                    className="flex items-center gap-2 px-2 py-2.5 text-left rounded-lg hover:bg-black/5 transition-colors"
                  >
                    {open ? (
                      <ChevronDown size={14} style={{ color: "var(--body)" }} />
                    ) : (
                      <ChevronRight size={14} style={{ color: "var(--body)" }} />
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                      Module {mi + 1}
                    </span>
                    <span className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}><BengaliText>{m.title}</BengaliText></span>
                  </button>
                  {open && (
                    <div className="flex flex-col gap-0.5 ml-[22px]">
                      {m.lessons.map((l, li) => {
                        const globalIndex = course.modules
                          .slice(0, mi)
                          .reduce((n, x) => n + x.lessons.length, 0) + li;
                        const isCurrent = globalIndex === index;
                        const isCompleted = completedLessons.has(globalIndex);
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
                                ? { background: "var(--brand-soft, rgba(107,76,224,0.06))" }
                                : { background: "transparent" }
                            }
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
                            ) : (
                              <PlayCircle
                                size={15}
                                style={{ color: isCurrent ? "var(--brand)" : "var(--body)" }}
                              />
                            )}
                            <span
                              className="text-[13px] leading-snug flex-1 min-w-0"
                              style={{
                                color: isCurrent ? "var(--ink)" : "var(--body)",
                                fontWeight: isCurrent ? 600 : 400,
                              }}
                            >
                              <BengaliText>{l.title}</BengaliText>
                            </span>
                            {quizScore && (
                              <span
                                className="font-mono text-[10px] font-semibold shrink-0 rounded-full px-2 py-0.5"
                                style={{
                                  background: quizScore.score >= 60
                                    ? "rgba(22,163,74,0.1)"
                                    : "rgba(239,68,68,0.1)",
                                  color: quizScore.score >= 60 ? "#16a34a" : "#dc2626",
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
              <p className="text-[13px] px-2 py-4" style={{ color: "var(--body)" }}>
                No lessons published yet.
              </p>
            )}
          </div>

          {course.books.length > 0 && (
            <div className="px-4 py-4 border-t" style={{ borderColor: "var(--line)" }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] mb-2.5" style={{ color: "var(--body)" }}>
                Course Books
              </p>
              <div className="flex flex-col gap-1.5">
                {course.books.map((book, i) => (
                  <a
                    key={i}
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-black/5"
                  >
                    <FileText size={15} style={{ color: "var(--brand)" }} />
                    <span className="text-[13px] font-medium truncate flex-1 min-w-0" style={{ color: "var(--ink)" }}>
                      {book.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Player */}
        <main className="flex-1 min-w-0 flex flex-col">
          {current ? (
            <div className="px-4 sm:px-8 py-6 flex flex-col">
              {/* Video player at top */}
              {tab === "lesson" && current.videoUrl && (
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--line)", background: "#000" }}>
                  <VideoPlayer url={current.videoUrl} />
                </div>
              )}
              {tab === "lesson" && !current.videoUrl && current.pdfUrl && (
                <a
                  href={current.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border flex items-center gap-4 px-6 py-5 transition-colors hover:bg-black/[0.02]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--brand-soft, rgba(107,76,224,0.08))" }}
                  >
                    <FileText size={22} style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                      Lesson Material
                    </p>
                    <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
                      Open the PDF lesson notes in a new tab
                    </p>
                  </div>
                  <svg className="ml-auto shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--body)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              )}
              {tab === "lesson" && !current.videoUrl && !current.pdfUrl && !current.content && (
                <div
                  className="rounded-xl border flex flex-col items-center justify-center gap-3 py-20 text-center px-6"
                  style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
                >
                  <PlayCircle size={34} style={{ color: "var(--body)" }} />
                  <p className="text-[14px]" style={{ color: "var(--body)" }}>
                    No content uploaded for this lesson yet.
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mt-5 p-1 rounded-xl w-fit" style={{ background: "var(--bg-soft, rgba(0,0,0,0.03))" }}>
                <button
                  type="button"
                  onClick={() => setTab("lesson")}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
                  style={
                    tab === "lesson"
                      ? { background: "white", color: "var(--ink)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                      : { color: "var(--body)" }
                  }
                >
                  <PlayCircle size={14} />
                  Lesson
                </button>
                <button
                  type="button"
                  onClick={() => setTab("quiz")}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
                  style={
                    tab === "quiz"
                      ? { background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }
                      : { color: "var(--body)" }
                  }
                >
                  <HelpCircle size={14} />
                  Quiz
                </button>
              </div>

              {/* Lesson title & meta */}
              <div className="mt-5">
                <h1 className="font-display text-[19px] sm:text-[22px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                  <BengaliText>{current.title}</BengaliText>
                </h1>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] mt-1" style={{ color: "var(--body)" }}>
                  {current.moduleTitle}
                  {current.duration ? ` · ${current.duration}` : ""}
                </p>
              </div>

              {/* Content area */}
              {tab === "lesson" ? (
                <>
                  {current.content && (
                    <div
                      className="mt-5 rounded-xl border p-5"
                      style={{ borderColor: "var(--line)", background: "var(--bg-soft, rgba(0,0,0,0.02))" }}
                    >
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--body)" }}>
                        Lesson Text
                      </p>
                      <div className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink)" }}>
                        <BengaliText>{current.content}</BengaliText>
                      </div>
                    </div>
                  )}
                  {current.pdfUrl && current.videoUrl && (
                    <a
                      href={current.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 self-start inline-flex items-center gap-2 rounded-full border px-5 py-[10px] text-[13px] font-medium transition-colors hover:bg-black/5"
                      style={{ color: "var(--ink)", borderColor: "var(--line)" }}
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
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
              <p className="text-[15px]" style={{ color: "var(--body)" }}>
                No lessons in this course yet.
              </p>
              <Link
                href="/dashboard/courses"
                className="rounded-full text-white text-[13.5px] font-medium px-5 py-[10px] hover:opacity-90 transition-opacity"
                style={{ background: "var(--brand)" }}
              >
                Browse courses
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
