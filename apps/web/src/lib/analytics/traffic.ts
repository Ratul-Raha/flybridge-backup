import "server-only";

import type { protos } from "@google-analytics/data";
import {
  cached,
  getAnalyticsClient,
  analyticsPropertyId,
  toNumber,
} from "./ga";
import {
  normalizeWindow,
  type TrafficDensityBucket,
  type TrafficRow,
  type TrafficSource,
  type TrafficTotals,
} from "./types";

export { normalizeWindow, TRAFFIC_WINDOWS } from "./types";

const CACHE_TTL_MS = 15_000;
const DEFAULT_LIMIT = 8;

type RealtimeRow = {
  dimensionValues?: { value?: string | null }[] | null;
  metricValues?: { value?: string | null }[] | null;
};

type RealtimeResponse = { rows?: RealtimeRow[] | null };

type RealtimeRequest = protos.google.analytics.data.v1beta.IRunRealtimeReportRequest;
type ReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest;

/**
 * The generated overloads intersect the promise with `void`, so the response
 * tuple cannot be destructured. The request types stay honest; only the
 * single-object response is narrowed here.
 */
function runRealtime(request: RealtimeRequest): Promise<RealtimeResponse> {
  return getAnalyticsClient().runRealtimeReport(request) as unknown as Promise<RealtimeResponse>;
}

function runReport(request: ReportRequest): Promise<RealtimeResponse> {
  return getAnalyticsClient().runReport(request) as unknown as Promise<RealtimeResponse>;
}

function dimension(name: string) {
  return { name };
}

function metric(name: string) {
  return { name };
}

async function realtime(
  body: {
    dimensions: string[];
    metrics: string[];
    limit?: number;
    orderBy?: string;
  },
  minutes: number
): Promise<RealtimeResponse> {
  return runRealtime({
    property: analyticsPropertyId(),
    minuteRanges: [{ startMinutesAgo: minutes, endMinutesAgo: 0 }],
    dimensions: body.dimensions.map(dimension),
    metrics: body.metrics.map(metric),
    limit: body.limit ?? 10_000,
    ...(body.orderBy
      ? { orderBys: [{ metric: { metricName: body.orderBy }, desc: true }] }
      : {}),
  });
}

function rows(response: RealtimeResponse): {
  dimension: string;
  values: number[];
}[] {
  return (response.rows ?? []).map((row) => {
    const first = row.dimensionValues?.[0]?.value ?? "";
    return {
      dimension: first,
      values: (row.metricValues ?? []).map((m) => toNumber(m.value)),
    };
  });
}

function toList(
  response: RealtimeResponse,
  primaryIndex: number,
  secondaryIndex: number
): TrafficRow[] {
  return rows(response)
    .filter((r) => r.dimension && r.dimension !== "(not set)" && r.dimension !== "(direct)")
    .map((r) => ({
      label: r.dimension,
      value: r.values[primaryIndex] ?? 0,
      secondary: r.values[secondaryIndex] ?? 0,
    }))
    .filter((r) => r.value > 0);
}

/**
 * Realtime dimension/metric compatibility is narrower than the standard report
 * and shifts as GA4 adds fields, so each slice degrades on its own instead of
 * taking the whole dashboard down with a 400.
 */
async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`analytics/traffic ${label} failed`, error);
    return fallback;
  }
}

export async function trafficDensity(minutes: number): Promise<TrafficDensityBucket[]> {
  const response = await realtime(
    { dimensions: ["minutesAgo"], metrics: ["activeUsers", "screenPageViews"] },
    minutes
  );

  const byMinute = new Map<number, TrafficDensityBucket>();
  for (const row of rows(response)) {
    const minutesAgo = Number(row.dimension);
    if (!Number.isFinite(minutesAgo)) continue;
    byMinute.set(minutesAgo, {
      minutesAgo,
      activeUsers: row.values[0] ?? 0,
      screenPageViews: row.values[1] ?? 0,
    });
  }

  // GA omits minutes with no traffic — backfill so the chart keeps an even axis.
  const series: TrafficDensityBucket[] = [];
  for (let m = minutes - 1; m >= 0; m--) {
    series.push(byMinute.get(m) ?? { minutesAgo: m, activeUsers: 0, screenPageViews: 0 });
  }
  return series;
}

async function todayTotals(): Promise<TrafficSource["today"]> {
  const empty = {
    activeUsers: 0,
    screenPageViews: 0,
    eventCount: 0,
    keyEvents: 0,
    hourly: [] as { label: string; activeUsers: number; sessions: number }[],
  };

  const run = async () => {
    const dateRanges = [{ startDate: "today", endDate: "today" }];
    const [totalsResponse, hourlyResponse] = await Promise.all([
      runReport({
        property: analyticsPropertyId(),
        dateRanges,
        metrics: ["activeUsers", "screenPageViews", "eventCount", "keyEvents"].map(metric),
      }),
      runReport({
        property: analyticsPropertyId(),
        dateRanges,
        dimensions: [dimension("hour")],
        metrics: [metric("activeUsers"), metric("sessions")],
        orderBys: [{ dimension: { dimensionName: "hour" } }],
      }),
    ]);

    const totals = totalsResponse.rows?.[0];
    const t = (i: number) => toNumber(totals?.metricValues?.[i]?.value);

    return {
      activeUsers: t(0),
      screenPageViews: t(1),
      eventCount: t(2),
      keyEvents: t(3),
      hourly: (hourlyResponse.rows ?? [])
        .map((row) => ({
          label: row.dimensionValues?.[0]?.value ?? "",
          activeUsers: toNumber(row.metricValues?.[0]?.value),
          sessions: toNumber(row.metricValues?.[1]?.value),
        }))
        .filter((h) => h.label !== ""),
    };
  };

  return safe("today", run, empty);
}

/**
 * Live traffic density over the trailing `minutes` window.
 *
 * The realtime endpoint is what backs GA4's own "Realtime" view: it reports
 * events as they stream in rather than the ~24h-delayed standard report, so
 * `minutesAgo: 30` is genuinely the last half hour.
 */
export async function trafficSource(minutes: number): Promise<TrafficSource> {
  const window = normalizeWindow(minutes);

  const [series, totalsResponse, pagesResponse, eventsResponse, sourcesResponse, devicesResponse, countriesResponse, today] =
    await Promise.all([
      cached(`series:${window}`, CACHE_TTL_MS, () => trafficDensity(window)),
      safe(
        "totals",
        () =>
          realtime(
            { dimensions: [], metrics: ["activeUsers", "screenPageViews", "eventCount", "keyEvents"] },
            window
          ),
        {} as RealtimeResponse
      ),
      safe(
        "pages",
        () =>
          realtime(
            {
              dimensions: ["pagePathPlusPageTitle"],
              metrics: ["activeUsers", "screenPageViews"],
              limit: DEFAULT_LIMIT,
              orderBy: "activeUsers",
            },
            window
          ),
        {} as RealtimeResponse
      ),
      safe(
        "events",
        () =>
          realtime(
            {
              dimensions: ["eventName"],
              metrics: ["eventCount", "activeUsers"],
              limit: DEFAULT_LIMIT,
              orderBy: "eventCount",
            },
            window
          ),
        {} as RealtimeResponse
      ),
      safe(
        "sources",
        () =>
          realtime(
            {
              dimensions: ["sessionSource"],
              metrics: ["activeUsers", "screenPageViews"],
              limit: DEFAULT_LIMIT,
              orderBy: "activeUsers",
            },
            window
          ),
        {} as RealtimeResponse
      ),
      safe(
        "devices",
        () =>
          realtime(
            {
              dimensions: ["deviceCategory"],
              metrics: ["activeUsers", "screenPageViews"],
              limit: DEFAULT_LIMIT,
              orderBy: "activeUsers",
            },
            window
          ),
        {} as RealtimeResponse
      ),
      safe(
        "countries",
        () =>
          realtime(
            {
              dimensions: ["country"],
              metrics: ["activeUsers", "screenPageViews"],
              limit: DEFAULT_LIMIT,
              orderBy: "activeUsers",
            },
            window
          ),
        {} as RealtimeResponse
      ),
      cached("today", 60_000, () => todayTotals()),
    ]);

  const totalsRow = (totalsResponse.rows ?? [])[0];
  const t = (i: number) => toNumber(totalsRow?.metricValues?.[i]?.value);
  const trafficDensityTotals: TrafficTotals = {
    activeUsers: t(0),
    screenPageViews: t(1),
    eventCount: t(2),
    keyEvents: t(3),
  };

  const peakBucket = series.reduce<TrafficDensityBucket | null>(
    (best, bucket) => (!best || bucket.activeUsers > best.activeUsers ? bucket : best),
    null
  );
  const peakActiveUsers = peakBucket?.activeUsers ?? 0;
  const averageActiveUsers =
    series.length === 0
      ? 0
      : Math.round((series.reduce((a: number, b: TrafficDensityBucket) => a + b.activeUsers, 0) / series.length) * 10) / 10;

  return {
    trafficDensity: trafficDensityTotals,
    window,
    series,
    peak: peakBucket && peakBucket.activeUsers > 0 ? peakBucket : null,
    peakActiveUsers,
    averageActiveUsers,
    pages: toList(pagesResponse, 0, 1),
    events: toList(eventsResponse, 0, 1),
    sources: toList(sourcesResponse, 0, 1),
    devices: toList(devicesResponse, 0, 1),
    countries: toList(countriesResponse, 0, 1),
    today,
    fetchedAt: new Date().toISOString(),
  };
}
