"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";

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

  const current = lessons[index];

  const goTo = (i: number) => {
    if (i < 0 || i >= lessons.length) return;
    setIndex(i);
    router.replace(`/programs/${course.slug}/learn?lesson=${i}`);
  };

  const markWatched = (i: number) => {
    if (lessons[i]?.videoUrl) {
      setWatched((prev) => {
        const next = new Set(prev);
        next.add(i);
        return next;
      });
    }
  };

  const toggleModule = (title: string) =>
    setOpenModules((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B1220" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-[#0B1220]/95 backdrop-blur" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/programs"
              className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-white/10"
              style={{ color: "#E8ECF4", borderColor: "rgba(255,255,255,0.16)" }}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Programs</span>
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
          <span
            className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] rounded-full px-3 py-[6px]"
            style={{ background: "rgba(46,230,168,0.14)", color: "#2EE6A8" }}
          >
            Player
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1320px] w-full mx-auto">
        {/* Sidebar */}
        <aside className="lg:w-[340px] lg:shrink-0 lg:border-r flex flex-col lg:max-h-[calc(100vh-64px)] lg:sticky lg:top-16 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
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
                              className="text-[13px] leading-snug"
                              style={{
                                color: isCurrent ? "#E8ECF4" : isWatched ? "#9FD7BE" : "#8B93A7",
                                fontWeight: isCurrent ? 600 : 400,
                              }}
                            >
                              {l.title}
                            </span>
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
              </div>

              <div className="px-4 sm:px-8 pb-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  disabled={index === 0}
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-[10px] text-[13.5px] font-medium transition-colors disabled:opacity-35 disabled:pointer-events-none hover:bg-white/5"
                  style={{ color: "#E8ECF4", borderColor: "rgba(255,255,255,0.16)" }}
                >
                  <ArrowLeft size={15} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markWatched(index);
                    goTo(index + 1);
                  }}
                  disabled={index >= lessons.length - 1}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-[10px] text-[13.5px] font-semibold transition-opacity disabled:opacity-35 disabled:pointer-events-none hover:opacity-90"
                  style={{ background: "var(--brand)", color: "#fff" }}
                >
                  Next lesson
                  <ArrowRight size={15} />
                </button>
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
