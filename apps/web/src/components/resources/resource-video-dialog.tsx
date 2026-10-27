"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageSquare, X } from "lucide-react";
import type { ResourceCardData } from "@/components/dashboard/user/resource-card";
import { ResourceVideoPlayer, VideoViews } from "@/components/resources/resource-video-player";
import { ResourceCommentsSection } from "@/components/resources/resource-comments";
import { ResourceLoveButton } from "@/components/resources/resource-love-button";

export function ResourceVideoDialog({
  resource,
  onClose,
  onCommentCountChange,
}: {
  resource: ResourceCardData;
  onClose: () => void;
  onCommentCountChange?: (id: string, total: number) => void;
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
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-2.5 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={resource.title}
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(107,76,224,0.18),transparent_60%),rgba(10,14,26,0.9)] backdrop-blur-[6px]"
        onClick={onClose}
      />

      <div
        className="relative grid max-h-[94vh] w-full max-w-[1080px] grid-cols-1 overflow-y-auto overflow-x-hidden rounded-[18px] bg-white shadow-[0_80px_160px_-60px_rgba(15,10,40,0.9)] ring-1 ring-white/10 lg:h-[min(880px,94vh)] lg:max-h-none lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden"
      >
        <div className="relative flex items-center justify-center bg-neutral-950 p-1.5 sm:p-2.5 lg:p-4">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px]">
            <ResourceVideoPlayer
              resource={resource}
              className="h-full w-full max-h-full max-w-full lg:h-full lg:w-auto"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-lg ring-1 ring-white/10 transition-all hover:bg-black/80 hover:scale-[1.02] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-col bg-white">
          <header className="flex items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5" style={{ borderColor: "var(--line)" }}>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug sm:text-[16px]" style={{ color: "var(--ink)" }}>
                {resource.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[11.5px]" style={{ color: "var(--body)" }}>
                <div className="flex items-center">
                  <ResourceLoveButton
                    resourceId={resource.id}
                    initialCount={resource.loveCount ?? 0}
                    initialLoved={resource.lovedByMe ?? false}
                  />
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium tabular-nums ring-1 ring-black/[0.02]"
                  style={{ background: "rgba(15,169,104,0.08)", color: "#0F9F5F" }}
                >
                  <MessageSquare size={10} strokeWidth={2.4} /> {(resource.commentCount ?? 0).toLocaleString()}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium tabular-nums ring-1 ring-black/[0.02]"
                  style={{ background: "rgba(107,76,224,0.08)", color: "#6B4CE0" }}
                >
                  <VideoViews count={resource.viewCount ?? 0} /> views
                </span>
                <Link
                  href={`/resources/${resource.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-all hover:bg-[var(--bg-soft)]"
                  style={{ color: "var(--brand)" }}
                >
                  View full page
                  <ArrowUpRight size={11} className="transition-transform group-hover:-translate-y-[1px] group-hover:translate-x-[1px]" />
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:bg-[var(--bg-soft)] active:scale-[0.98] lg:flex"
              style={{ color: "var(--body)" }}
            >
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-3 sm:px-5">
            <ResourceCommentsSection
              resourceId={resource.id}
              compact
              onChanged={(t) => onCommentCountChange?.(resource.id, t)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
