import "server-only";

import { connectDb } from "@/lib/db";
import { EmailClick } from "@/lib/models/email-click";
import { resolveDashboardRange, type DashboardRangeSelection } from "@/lib/admin/dashboard-range";
import { MARKETING_REPORT_TIME_ZONE, marketingDateKey } from "@/lib/marketing-analytics-period";
import type {
  AdminEmailClickAnalytics,
  EmailClickCampaign,
  EmailClickDestination,
  EmailClickRow,
  EmailClickSource,
  EmailClickTemplate,
} from "@/lib/admin/email-clicks-types";

const DAY_MS = 24 * 60 * 60 * 1000;

function daySeries(start: Date, end: Date) {
  const keys: string[] = [];
  const labels: string[] = [];
  for (let day = new Date(start); day < end; day = new Date(day.getTime() + DAY_MS)) {
    keys.push(marketingDateKey(day));
    labels.push(
      new Intl.DateTimeFormat("en-US", {
        timeZone: MARKETING_REPORT_TIME_ZONE,
        month: "short",
        day: "numeric",
      }).format(day),
    );
  }
  return { keys, labels };
}

function number(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getEmailClickAnalytics(
  selection: DashboardRangeSelection,
): Promise<AdminEmailClickAnalytics> {
  await connectDb();
  const range = resolveDashboardRange(selection);
  const { start, end } = range;
  const dateMatch = { createdAt: { $gte: start, $lt: end } };

  const [clicks, uniqueRecipients, uniqueCampaigns, uniqueDestinations, trendRows, sourceRows, campaignRows, templateRows, destinationRows, recentRows] =
    await Promise.all([
      EmailClick.countDocuments(dateMatch),
      EmailClick.distinct("recipient", { ...dateMatch, recipient: { $nin: ["", null] } }),
      EmailClick.distinct("campaign", { ...dateMatch, campaign: { $nin: ["", null] } }),
      EmailClick.distinct("destination", { ...dateMatch, destination: { $nin: ["", null] } }),
      EmailClick.aggregate<{ _id: string; clicks: number }>([
        { $match: dateMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: MARKETING_REPORT_TIME_ZONE,
              },
            },
            clicks: { $sum: 1 },
          },
        },
      ]),
      EmailClick.aggregate<{ _id: { source: string; medium: string }; clicks: number; members: string[] }>([
        { $match: dateMatch },
        {
          $group: {
            _id: {
              source: { $ifNull: ["$source", "email"] },
              medium: { $ifNull: ["$medium", "email"] },
            },
            clicks: { $sum: 1 },
            members: { $addToSet: "$recipient" },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),
      EmailClick.aggregate<{ _id: string; clicks: number; members: string[] }>([
        { $match: dateMatch },
        {
          $group: {
            _id: "$campaign",
            clicks: { $sum: 1 },
            members: { $addToSet: "$recipient" },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 8 },
      ]),
      EmailClick.aggregate<{ _id: string; clicks: number; members: string[] }>([
        { $match: { ...dateMatch, templateId: { $nin: ["", null] } } },
        {
          $group: {
            _id: "$templateId",
            clicks: { $sum: 1 },
            members: { $addToSet: "$recipient" },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 8 },
      ]),
      EmailClick.aggregate<{ _id: string; clicks: number; members: string[] }>([
        { $match: dateMatch },
        {
          $group: {
            _id: "$destination",
            clicks: { $sum: 1 },
            members: { $addToSet: "$recipient" },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 8 },
      ]),
      EmailClick.find(dateMatch).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

  const recipientsCount = uniqueRecipients.length;

  const { keys, labels } = daySeries(start, end);
  const trendByKey = new Map(trendRows.map((row) => [row._id, number(row.clicks)]));

  const topSources: EmailClickSource[] = sourceRows.map((row) => ({
    source: row._id.source || "email",
    medium: row._id.medium || "email",
    clicks: number(row.clicks),
    recipients: new Set(row.members.filter(Boolean)).size,
  }));

  const topCampaigns: EmailClickCampaign[] = campaignRows.map((row) => ({
    campaign: row._id || "email",
    clicks: number(row.clicks),
    recipients: new Set(row.members.filter(Boolean)).size,
  }));
  const topTemplates: EmailClickTemplate[] = templateRows.map((row) => ({
    templateId: row._id,
    clicks: number(row.clicks),
    recipients: new Set(row.members.filter(Boolean)).size,
  }));

  const topDestinations: EmailClickDestination[] = destinationRows.map((row) => ({
    destination: row._id || "/",
    clicks: number(row.clicks),
    recipients: new Set(row.members.filter(Boolean)).size,
  }));

  const recent: EmailClickRow[] = recentRows.map((row) => ({
    id: (row as { _id: unknown })._id?.toString() ?? "",
    source: row.source || "email",
    medium: row.medium || "email",
    campaign: row.campaign || "email",
    templateId: row.templateId ?? "",
    recipient: row.recipient ?? "",
    destination: row.destination ?? "",
    referrer: row.referrer ?? "",
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    period: range.period,
    range: { from: range.from, to: range.to, days: range.days, label: range.label },
    metrics: {
      clicks,
      uniqueRecipients: recipientsCount,
      uniqueCampaigns: uniqueCampaigns.length,
      uniqueDestinations: uniqueDestinations.length,
      clicksPerRecipient: recipientsCount > 0 ? Math.round((clicks / recipientsCount) * 10) / 10 : 0,
    },
    trend: {
      labels,
      clicks: keys.map((key) => trendByKey.get(key) ?? 0),
    },
    topSources,
    topCampaigns,
    topTemplates,
    topDestinations,
    recent,
  };
}
