"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Eye, Play, X } from "lucide-react";
import type { ResourceCardData } from "@/components/dashboard/user/resource-card";

export function resourceStreamUrl(id: string) {
  return `/api/resources/${id}/file`;
}

function formatViews(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Portrait ("reels") video player for resources. Native controls give
 * play/pause, volume and fullscreen (maximize/minimize); download and
 * picture-in-picture are disabled so the video can only be watched.
 */
export function ResourceVideoPlayer({
  resource,
  className = "",
}: {
  resource: ResourceCardData;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  const blockContext = (e: ReactMouseEvent) => e.preventDefault();

  const fireView = () => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    fetch(`/api/resources/${resource.id}/view`, { method: "POST", keepalive: true }).catch(() => {});
  };

  const handlePlay = () => {
    setPlaying(true);
    fireView();
  };

  return (
    <div
      className={`relative aspect-[9/16] overflow-hidden bg-black ${className}`}
      onContextMenu={blockContext}
      onDragStart={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={resourceStreamUrl(resource.id)}
        poster={resource.thumbnail ?? undefined}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="metadata"
        onPlay={handlePlay}
        onPause={() => setPlaying(false)}
        className="h-full w-full object-cover"
        onContextMenu={blockContext}
      />

      {!playing && (
        <button
          type="button"
          onClick={() => videoRef.current?.play()}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-transform duration-200 hover:scale-105" style={{ boxShadow: "0 18px 40px -14px rgba(0,0,0,0.5)" }}>
            <Play className="ml-1 h-7 w-7" fill="currentColor" strokeWidth={0} />
          </span>
        </button>
      )}
    </div>
  );
}

export function VideoViews({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Eye size={12} />
      {formatViews(count ?? 0)}
    </span>
  );
}

/**
 * Full-screen-ish portrait modal used on the dashboard so a video resource
 * can be watched in place without ever exposing a download link.
 */
export function ResourceVideoModal({
  resource,
  onClose,
}: {
  resource: ResourceCardData;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={resource.title}>
      <div className="absolute inset-0 bg-[rgba(10,14,26,0.82)] backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[min(92vh,780px)] w-[min(92vw,440px)] flex-col overflow-hidden rounded-2xl bg-black" style={{ boxShadow: "0 40px 90px -30px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{resource.title}</p>
            <p className="flex items-center gap-1 text-[11px] text-white/60">
              <VideoViews count={resource.viewCount ?? 0} /> views
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center min-h-0 p-3">
          <div
            className="relative overflow-hidden rounded-xl bg-black"
            style={{ height: "100%", maxWidth: "100%", aspectRatio: "9 / 16" }}
          >
            <ResourceVideoPlayer resource={resource} className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
