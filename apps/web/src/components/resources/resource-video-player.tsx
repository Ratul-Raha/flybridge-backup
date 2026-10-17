"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Eye, Lock, Play, X } from "lucide-react";
import type { ResourceCardData } from "@/components/dashboard/user/resource-card";
import { useAuth } from "@/lib/auth/auth-context";
import { SignInModal } from "@/components/resources/sign-in-modal";

export function resourceStreamUrl(id: string) {
  return `/api/resources/${id}/file`;
}

function formatViews(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Video player for resources. Public videos play for everyone; members-only
 * videos show a "sign in to view" gate until the visitor authenticates.
 * Native controls give play/pause, volume and fullscreen (maximize/minimize);
 * download and picture-in-picture are disabled so the video can only be
 * watched.
 */
export function ResourceVideoPlayer({
  resource,
  className = "",
}: {
  resource: ResourceCardData;
  className?: string;
}) {
  const { user, loading } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const isMembersOnly = resource.access === "members";

  const blockContext = (e: ReactMouseEvent) => e.preventDefault();

  const fireView = () => {
    fetch(`/api/resources/${resource.id}/view`, { method: "POST", keepalive: true }).catch(() => {});
  };

  const handlePlay = () => {
    setPlaying(true);
    fireView();
  };

  if (isMembersOnly && loading) {
    return <div className={`relative aspect-[3/4] overflow-hidden bg-black ${className}`} />;
  }

  if (isMembersOnly && !user) {
    return (
      <>
        <div
          className={`relative aspect-[3/4] overflow-hidden bg-black ${className}`}
          onContextMenu={blockContext}
          onDragStart={(e) => e.preventDefault()}
        >
          {resource.thumbnail ? (
            <img
              src={resource.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(160deg, #1a1f35, #0a0e1a)" }}
            />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <button
            type="button"
            onClick={() => setShowSignIn(true)}
            aria-label="Sign in to view"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-transform duration-200 hover:scale-105"
              style={{ boxShadow: "0 18px 40px -14px rgba(0,0,0,0.5)" }}
            >
              <Play className="ml-1 h-5 w-5" fill="currentColor" strokeWidth={0} />
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <Lock size={11} /> Sign in to view
            </span>
          </button>
        </div>
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      </>
    );
  }

  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden bg-black ${className}`}
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
        preload="none"
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
          <span
            className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-transform duration-200 hover:scale-105"
            style={{ boxShadow: "0 18px 40px -14px rgba(0,0,0,0.5)" }}
          >
            <Play className="ml-1 h-6 w-6" fill="currentColor" strokeWidth={0} />
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
 * Full-screen-ish modal used on the dashboard so a video resource can be
 * watched in place without ever exposing a download link.
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

      <div className="relative flex w-[min(88vw,340px)] flex-col overflow-hidden rounded-2xl bg-black" style={{ boxShadow: "0 40px 90px -30px rgba(0,0,0,0.6)" }}>
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
          <ResourceVideoPlayer resource={resource} className="w-full" />
        </div>
      </div>
    </div>
  );
}
