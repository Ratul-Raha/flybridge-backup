"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones } from "lucide-react";
import { isYouTubeUrl, youtubeEmbedSrc } from "@/lib/youtube";

/**
 * The listening media shown to a student mid-test. Unlike the admin preview,
 * this is one-shot: audio starts automatically when the test begins and plays
 * through to the end with no pause, seek or replay control — matching real
 * IELTS listening.
 */
export function ListeningTestPlayer({
  audioUrl,
  videoUrl,
}: {
  audioUrl?: string | null;
  videoUrl?: string | null;
}) {
  const preferred = videoUrl || audioUrl;
  if (!preferred) return null;

  if (isYouTubeUrl(preferred)) {
    const src = `${youtubeEmbedSrc(preferred)}&autoplay=1&controls=0&disablekb=1`;
    return (
      <iframe
        src={src}
        title="Listening audio"
        className="pointer-events-none w-full rounded-lg bg-black"
        style={{ aspectRatio: "16 / 9", border: "0" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return <OneShotMedia src={preferred} isVideo={Boolean(videoUrl)} />;
}

function OneShotMedia({ src, isVideo }: { src: string; isVideo: boolean }) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [status, setStatus] = useState<"playing" | "ended">("playing");
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const onTime = () => setElapsed(el.currentTime);
    const onEnded = () => setStatus("ended");
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);

    const attempt = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      el.currentTime = 0;
      void el.play().catch(() => {
        startedRef.current = false;
      });
    };
    attempt();

    // Browsers can block autoplay without a recent user gesture. The mock
    // already requires a click to begin, but as a safety net retry on any
    // interaction so the audio never stays silent.
    const onInteract = () => {
      if (!startedRef.current) attempt();
    };
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const media = isVideo ? (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={(el) => {
        mediaRef.current = el;
      }}
      src={src}
      className="hidden"
      playsInline
      autoPlay
    />
  ) : (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio
      ref={(el) => {
        mediaRef.current = el;
      }}
      src={src}
      className="hidden"
      autoPlay
    />
  );

  return (
    <div className="rounded-xl border bg-[#FBFBFD] px-4 py-4" style={{ borderColor: "var(--line)" }}>
      {media}
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
        >
          <Headphones size={16} />
        </span>
        {status === "playing" ? (
          <span className="text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
            Audio is playing ({fmt(elapsed)}) — it plays once through and cannot be paused.
          </span>
        ) : (
          <span className="text-[12.5px] font-medium" style={{ color: "var(--brand-2)" }}>
            Audio finished.
          </span>
        )}
      </div>
    </div>
  );
}
