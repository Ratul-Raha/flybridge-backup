"use client";

import { isYouTubeUrl, youtubeEmbedSrc } from "@/lib/youtube";

export function ListeningMediaPlayer({
  audioUrl,
  videoUrl,
}: {
  audioUrl?: string | null;
  videoUrl?: string | null;
}) {
  const preferred = videoUrl || audioUrl;
  const isYoutube = !!preferred && isYouTubeUrl(preferred);

  if (!preferred) return null;

  if (isYoutube) {
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

  if (videoUrl) {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video controls src={videoUrl} className="w-full max-h-[480px] rounded-lg" />;
  }

  if (audioUrl) {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <audio controls src={audioUrl} className="w-full" />;
  }

  return null;
}