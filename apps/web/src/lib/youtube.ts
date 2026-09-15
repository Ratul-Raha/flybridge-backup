function parseStartSeconds(raw: string): number {
  if (!raw) return 0;
  let m = raw.match(/^(\d+)$/);
  if (m) return Number(m[1]);
  m = raw.match(/^(\d+)m(\d+)s?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = raw.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = raw.match(/^(\d+)s$/);
  if (m) return Number(m[1]);
  return 0;
}

export function youtubeIdFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (!/youtu\.?be/i.test(t) && !/youtube/i.test(t)) return null;

  const patterns = [
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*?v=|shorts\/|embed\/|v\/|live\/))([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/watch\b[^#]*(?:[?&#]|#)v=([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function isYouTubeUrl(url?: string | null): boolean {
  return !!url && youtubeIdFromUrl(url) !== null;
}

export function youtubeStartSeconds(url: string): number {
  if (!url || typeof url !== "string") return 0;
  const t = url
    .split(/[?&#]/)
    .find((p) => p.startsWith("t="));
  if (!t) return 0;
  return parseStartSeconds(t.slice(2));
}

export function youtubeEmbedSrc(url: string): string {
  const id = youtubeIdFromUrl(url) ?? "";
  const start = youtubeStartSeconds(url);
  const params = new URLSearchParams({
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  if (start > 0) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}