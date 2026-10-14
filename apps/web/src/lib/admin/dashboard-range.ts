import {
  MARKETING_PERIODS,
  MARKETING_REPORT_TIME_ZONE,
  marketingPeriodWindow,
  type MarketingPeriod,
} from "@/lib/marketing-analytics-period";

export const DASHBOARD_PERIODS = [...MARKETING_PERIODS, "custom"] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export type DashboardRangeSelection =
  { period: MarketingPeriod } | { period: "custom"; from: string; to: string };

export type ResolvedDashboardRange = {
  period: DashboardPeriod;
  start: Date;
  end: Date;
  days: number;
  from: string;
  to: string;
  label: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

function dateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MARKETING_REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dhakaMidnight(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return new Date(utc - DHAKA_OFFSET_MS);
}

function rangeLabel(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: MARKETING_REPORT_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const lastDay = new Date(end.getTime() - 1);
  const from = new Intl.DateTimeFormat("en-US", options).format(start);
  const to = new Intl.DateTimeFormat("en-US", options).format(lastDay);
  return from === to ? from : `${from} – ${to}`;
}

export function resolveDashboardRange(
  selection: DashboardRangeSelection,
  now = new Date(),
): ResolvedDashboardRange {
  let start: Date;
  let end: Date;

  if (selection.period === "custom") {
    const customStart = dhakaMidnight(selection.from);
    const customEnd = dhakaMidnight(selection.to);
    if (!customStart || !customEnd || customEnd < customStart) {
      throw new Error("Choose a valid start and end date.");
    }
    start = customStart;
    end = new Date(customEnd.getTime() + DAY_MS);
  } else {
    ({ start, end } = marketingPeriodWindow(selection.period, now));
  }

  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  if (days < 1 || days > 366) {
    throw new Error("Choose a date range of 1 to 366 days.");
  }

  return {
    period: selection.period,
    start,
    end,
    days,
    from: dateKey(start),
    to: dateKey(new Date(end.getTime() - 1)),
    label: rangeLabel(start, end),
  };
}

export function dashboardRangeQuery(selection: DashboardRangeSelection): string {
  const params = new URLSearchParams();
  if (selection.period === "custom") {
    params.set("period", "custom");
    params.set("from", selection.from);
    params.set("to", selection.to);
  } else {
    params.set("period", selection.period);
  }
  return params.toString();
}

export function dashboardSelectionFromParams(params: URLSearchParams): DashboardRangeSelection {
  const rawPeriod = params.get("period") ?? "30d";
  if (rawPeriod === "custom") {
    return {
      period: "custom",
      from: params.get("from") ?? "",
      to: params.get("to") ?? "",
    };
  }
  const period = (MARKETING_PERIODS as readonly string[]).includes(rawPeriod)
    ? (rawPeriod as MarketingPeriod)
    : "30d";
  return { period };
}
