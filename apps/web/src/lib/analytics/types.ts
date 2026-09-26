/**
 * Shared shapes for the admin traffic dashboard.
 *
 * Deliberately free of `server-only` so client components can import the types
 * without pulling the GA4 client into the browser bundle.
 */

/** Realtime windows an admin can look at. */
export const TRAFFIC_WINDOWS = [5, 15, 30, 60] as const;
export type TrafficWindow = (typeof TRAFFIC_WINDOWS)[number];

export type TrafficTotals = {
  activeUsers: number;
  screenPageViews: number;
  eventCount: number;
  keyEvents: number;
};

export type TrafficRow = {
  label: string;
  value: number;
  secondary: number;
};

export type TrafficDensityBucket = {
  /** Minutes before now — 0 is the current minute. */
  minutesAgo: number;
  activeUsers: number;
  screenPageViews: number;
};

export type TodayTraffic = TrafficTotals & {
  hourly: { label: string; activeUsers: number; sessions: number }[];
};

export type TrafficSource = {
  trafficDensity: TrafficTotals;
  window: TrafficWindow;
  /** Per-minute series, oldest first, for the density chart. */
  series: TrafficDensityBucket[];
  peak: TrafficDensityBucket | null;
  /** Peak concurrency in the window — "how busy were we at the busiest minute". */
  peakActiveUsers: number;
  averageActiveUsers: number;
  pages: TrafficRow[];
  events: TrafficRow[];
  sources: TrafficRow[];
  devices: TrafficRow[];
  countries: TrafficRow[];
  /** Same-day totals so the live window has something to be measured against. */
  today: TodayTraffic;
  fetchedAt: string;
};

export type TrafficResponse =
  | { configured: true; data: TrafficSource }
  | { configured: false; missing: string[]; windows?: readonly number[] }
  | { configured?: undefined; error: string };

export function normalizeWindow(minutes: number): TrafficWindow {
  return TRAFFIC_WINDOWS.find((w) => w === minutes) ?? 30;
}
