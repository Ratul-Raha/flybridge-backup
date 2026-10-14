"use client";

import type { UsageEventType } from "@/lib/models/usage-event";

export type TrackUsageInput = {
  event: UsageEventType;
  path: string;
  courseSlug?: string;
  moduleIndex?: number;
  lessonIndex?: number;
};

export function trackUsageEvent(input: TrackUsageInput) {
  if (typeof window === "undefined") return;

  const key = [
    "flybridge-usage",
    input.event,
    input.path,
    input.courseSlug ?? "",
    input.moduleIndex ?? "",
    input.lessonIndex ?? "",
  ].join(":");

  try {
    const last = Number(window.sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 2_000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // Storage can be disabled; analytics should never block product usage.
  }

  fetch("/api/usage/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {});
}
