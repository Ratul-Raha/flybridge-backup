"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Play } from "lucide-react";
import { isYouTubeUrl, youtubeEmbedSrc } from "@/lib/youtube";

/**
 * The listening media shown to a student mid-test. Unlike the admin preview,
 * this is one-shot: once the audio starts it plays through to the end and the
 * student has no pause, seek or replay control — matching real IELTS listening.
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
    return (
      <iframe
        src={youtubeEmbedSrc(preferred)}
        title="Listening audio"
        className="w-full rounded-lg bg-black"
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
  const [status, setStatus] = useState<"idle" | "playing" | "ended">("idle");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const onTime = () => setElapsed(el.currentTime);
    const onEnded = () => setStatus("ended");
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const start = () => {
    const el = mediaRef.current;
    if (!el || status !== "idle") return;
    el.currentTime = 0;
    void el.play().catch(() => setStatus("idle"));
    setStatus("playing");
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const media = isVideo ? (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video ref={(el) => { mediaRef.current = el; }} src={src} className="hidden" playsInline />
  ) : (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio ref={(el) => { mediaRef.current = el; }} src={src} className="hidden" />
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
        {status === "idle" && (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Play size={14} /> Play listening audio
          </button>
        )}
        {status === "playing" && (
          <span className="text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
            Audio is playing ({fmt(elapsed)}) — it plays once through and cannot be paused.
          </span>
        )}
        {status === "ended" && (
          <span className="text-[12.5px] font-medium" style={{ color: "var(--brand-2)" }}>
            Audio finished.
          </span>
        )}
      </div>
    </div>
  );
}
