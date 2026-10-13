export const MARKETING_REPORT_TIME_ZONE = "Asia/Dhaka";
export const MARKETING_PERIODS = ["7d", "30d", "month", "last-month"] as const;

export type MarketingPeriod = (typeof MARKETING_PERIODS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export function parseMarketingPeriod(value: string | null | undefined): MarketingPeriod {
  return (MARKETING_PERIODS as readonly string[]).includes(value ?? "")
    ? (value as MarketingPeriod)
    : "30d";
}

function dhakaMidnightUtc(now: Date): {
  today: Date;
  twoMonthsBefore: Date;
  previousMonth: Date;
  month: Date;
} {
  const dhakaClock = new Date(now.getTime() + DHAKA_OFFSET_MS);
  const year = dhakaClock.getUTCFullYear();
  const monthIndex = dhakaClock.getUTCMonth();
  const day = dhakaClock.getUTCDate();
  return {
    today: new Date(Date.UTC(year, monthIndex, day) - DHAKA_OFFSET_MS),
    twoMonthsBefore: new Date(Date.UTC(year, monthIndex - 2, 1) - DHAKA_OFFSET_MS),
    previousMonth: new Date(Date.UTC(year, monthIndex - 1, 1) - DHAKA_OFFSET_MS),
    month: new Date(Date.UTC(year, monthIndex, 1) - DHAKA_OFFSET_MS),
  };
}

export function marketingPeriodWindow(period: MarketingPeriod, now = new Date()) {
  const { today, twoMonthsBefore, previousMonth, month } = dhakaMidnightUtc(now);
  let start: Date;
  let end: Date;
  let comparisonStart: Date | undefined;
  let comparisonEnd: Date | undefined;

  if (period === "7d") {
    end = new Date(today.getTime() + DAY_MS);
    start = new Date(today.getTime() - 6 * DAY_MS);
  } else if (period === "30d") {
    end = new Date(today.getTime() + DAY_MS);
    start = new Date(today.getTime() - 29 * DAY_MS);
  } else if (period === "month") {
    start = month;
    end = new Date(today.getTime() + DAY_MS);
  } else {
    start = previousMonth;
    end = month;
    comparisonStart = twoMonthsBefore;
    comparisonEnd = previousMonth;
  }

  const duration = end.getTime() - start.getTime();
  return {
    start,
    end,
    previousStart: comparisonStart ?? new Date(start.getTime() - duration),
    previousEnd: comparisonEnd ?? start,
  };
}

export function marketingDateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKETING_REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
