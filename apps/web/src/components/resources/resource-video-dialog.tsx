"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageSquare, X } from "lucide-react";
import type { ResourceCardData } from "@/components/dashboard/user/resource-card";
import { ResourceVideoPlayer, VideoViews } from "@/components/resources/resource-video-player";
import { ResourceCommentsSection } from "@/components/resources/resource-comments";
import { ResourceLoveButton } from "@/components/resources/resource-love-button";

/**
 * Social-style video dialog for the public listing: the video plays in place
 * with the love button and the full comment thread alongside, so visitors can
 * react and comment without leaving the page.
 */
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
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={resource.title}
    >
      <div className="absolute inset-0 bg-[rgba(10,14,26,0.82)] backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative grid max-h-[92vh] w-full max-w-[980px] grid-cols-1 overflow-y-auto overflow-x-hidden rounded-2xl bg-white lg:h-[min(760px,92vh)] lg:max-h-none lg:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden"
        style={{ boxShadow: "0 40px 90px -30px rgba(0,0,0,0.6)" }}
      >
        {/* Media */}
        <div className="relative flex items-center justify-center bg-black p-2 sm:p-3">
          <div className="w-full max-w-[320px]">
            <ResourceVideoPlayer resource={resource} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Discussion */}
        <div className="flex min-h-0 flex-col">
          <header className="flex items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "var(--line)" }}>
            <div className="min-w-0">
              <h2 className="truncate font-display text-[15.5px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                {resource.title}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px]" style={{ color: "var(--body)" }}>
                <ResourceLoveButton
                  resourceId={resource.id}
                  initialCount={resource.loveCount ?? 0}
                  initialLoved={resource.lovedByMe ?? false}
                />
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em]"
                  style={{ background: "rgba(15,169,104,0.10)", color: "#0FA968" }}
                >
                  <MessageSquare size={9} strokeWidth={2.5} /> {(resource.commentCount ?? 0).toLocaleString()}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em]"
                  style={{ background: "rgba(107,76,224,0.10)", color: "#6B4CE0" }}
                >
                  <VideoViews count={resource.viewCount ?? 0} /> views
                </span>
                <Link
                  href={`/resources/${resource.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "var(--brand)" }}
                >
                  Full page <ArrowUpRight size={11} />
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-soft)] lg:flex"
              style={{ color: "var(--body)" }}
            >
              <X size={18} />
            </button>
          </header>

          <div className="px-5 pb-6 pt-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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
