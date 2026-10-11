"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Volume2 } from "lucide-react";
import { isYouTubeUrl, youtubeEmbedSrc } from "@/lib/youtube";

/**
 * The listening media shown to a student mid-test. Unlike the admin preview,
 * this is one-shot: audio starts automatically when the test begins and plays
 * through to the end with no pause, seek or replay control — matching real
 * IELTS listening. A progress bar and volume control are shown, exactly like
 * the official computer-delivered player.
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
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const onTime = () => setElapsed(el.currentTime);
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onEnded = () => setStatus("ended");
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("loadedmetadata", onMeta);
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
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnded);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const pct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

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
    <div className="rounded-xl border bg-[#FBFBFD] px-5 py-4" style={{ borderColor: "var(--line)" }}>
      {media}
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
        >
          <Headphones size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
              Listening audio
            </span>
            <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
              {status === "playing" ? "Playing — cannot be paused or replayed" : "Audio finished"}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-soft)" }}>
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-linear"
              style={{ width: `${pct}%`, background: "var(--brand)" }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--body)" }}>
              {fmt(elapsed)} / {duration > 0 ? fmt(duration) : "—:—"}
            </span>
            <label className="flex items-center gap-2" title="Volume">
              <Volume2 size={14} style={{ color: "var(--body)" }} />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => {
                  const v = Number(e.target.value) / 100;
                  setVolume(v);
                  if (mediaRef.current) mediaRef.current.volume = v;
                }}
                className="h-1 w-24 cursor-pointer accent-[var(--brand)]"
                aria-label="Volume"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
