"use client";

import { useEffect, useState } from "react";
import { X, Play } from "lucide-react";

export type StoryVideo = {
  title: string;
  duration: string;
  tag: string;
  gradient: string;
  initials: string;
  src?: string;
  poster?: string;
};

export function VideoModal({ video, onClose }: { video: StoryVideo; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Video player">
      <div className="absolute inset-0 bg-[rgba(18,32,67,0.65)] backdrop-blur-[3px]" onClick={onClose} />

      <div
        className="relative w-full max-w-[900px] rounded-[22px] bg-white p-4 sm:p-6 animate-fade-up"
        style={{ boxShadow: "0 40px 80px -30px rgba(18,32,67,0.5)" }}
      >
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white border border-line transition-transform hover:scale-105"
        >
          <X className="w-4 h-4" style={{ color: "var(--ink)" }} />
        </button>

        {video.src ? (
          <video src={video.src} controls autoPlay className="w-full aspect-video rounded-xl bg-black" />
        ) : (
          <div
            className="relative aspect-video rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-8"
            style={{ background: video.gradient }}
          >
            <span className="w-[70px] h-[70px] rounded-full bg-white/20 flex items-center justify-center mb-5">
              <Play className="w-7 h-7 ml-[2px]" fill="#fff" stroke="#fff" />
            </span>
            <h3 className="font-display text-[19px] font-semibold text-white max-w-[420px]">{video.title}</h3>
            <p className="text-[13px] mt-2 text-white/80">
              Video coming soon — we&apos;re editing this story. Check back shortly.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-4 px-1 flex-wrap">
          <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{video.title}</div>
          <div className="font-mono text-[10.5px] tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>
            {video.tag} · {video.duration}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroVideo({ video }: { video: StoryVideo }) {
  const [playing, setPlaying] = useState(false);

  const hasVideo = Boolean(video.src);

  return (
    <div className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/60">
      <div
        className="relative aspect-video overflow-hidden rounded-lg border border-line"
        style={{ background: video.gradient, boxShadow: "0 30px 60px -25px rgba(18,32,67,0.4)" }}
      >
        {playing && hasVideo ? (
          <video
            src={video.src}
            controls
            autoPlay
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
        ) : (
          <>
            {hasVideo && video.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.poster}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-display font-semibold text-[64px] text-white/20 select-none">
                  {video.initials}
                </span>
              </>
            )}

            {hasVideo && (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${video.title}`}
                className="absolute inset-0 z-10 flex items-center justify-center"
              >
                <span className="w-[74px] h-[74px] rounded-full bg-white/95 flex items-center justify-center shadow-xl transition-transform duration-300 hover:scale-110">
                  <Play className="w-7 h-7 ml-[2px]" fill="var(--brand)" stroke="var(--brand)" />
                </span>
              </button>
            )}

            <span
              className={`absolute top-4 left-4 font-mono text-[10.5px] font-medium tracking-[0.4px] uppercase px-[12px] py-[6px] rounded-full text-white ${
                hasVideo ? "z-10" : ""
              }`}
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
            >
              FEATURED STORY
            </span>
            <span
              className={`absolute bottom-4 right-4 font-mono text-[11px] font-medium px-[10px] py-[5px] rounded-md text-white ${
                hasVideo ? "z-10" : ""
              }`}
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              {video.duration}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 mt-4 px-1">
        <div>
          <h3 className="text-[15.5px] font-medium" style={{ color: "var(--ink)" }}>{video.title}</h3>
          <p className="font-mono text-[10.5px] tracking-[0.3px] uppercase mt-[3px]" style={{ color: "var(--body)" }}>
            {video.tag} · {hasVideo ? "Watch the full story" : "Coming soon"}
          </p>
        </div>
        {!playing && (
          <span className="w-[40px] h-[40px] rounded-full border border-line bg-white flex items-center justify-center shrink-0 transition-all duration-250">
            <Play className="w-4 h-4 ml-[1px]" fill="var(--brand)" stroke="var(--brand)" />
          </span>
        )}
      </div>
    </div>
  );
}

export function VideoGallery({ videos }: { videos: StoryVideo[] }) {
  const [active, setActive] = useState<StoryVideo | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {videos.map((v) => (
          <button
            key={v.title}
            onClick={() => setActive(v)}
            className="group text-left rounded-lg border border-line bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/60"
            style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
          >
            <div className="relative aspect-video overflow-hidden" style={{ background: v.gradient }}>
              <span className="absolute inset-0 flex items-center justify-center font-display font-semibold text-[34px] text-white/20 select-none">
                {v.initials}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-[58px] h-[58px] rounded-full bg-white/95 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="w-5 h-5 ml-[2px]" fill="var(--brand)" stroke="var(--brand)" />
                </span>
              </span>
              <span
                className="absolute top-3 left-3 font-mono text-[10px] font-medium tracking-[0.4px] px-[10px] py-[5px] rounded-full text-white"
                style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
              >
                {v.tag}
              </span>
              <span
                className="absolute bottom-3 right-3 font-mono text-[10.5px] font-medium px-[9px] py-[4px] rounded-md text-white"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                {v.duration}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-[14px] font-medium leading-[1.45]" style={{ color: "var(--ink)" }}>
                {v.title}
              </h3>
            </div>
          </button>
        ))}
      </div>

      {active && <VideoModal video={active} onClose={() => setActive(null)} />}
    </>
  );
}
