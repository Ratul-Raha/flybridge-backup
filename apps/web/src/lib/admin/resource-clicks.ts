import "server-only";

import type { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { LinkClick } from "@/lib/models/link-click";
import { Resource } from "@/lib/models/resource";
import { User } from "@/lib/models/user";
import { resolveDashboardRange, type DashboardRangeSelection } from "@/lib/admin/dashboard-range";
import { MARKETING_REPORT_TIME_ZONE, marketingDateKey } from "@/lib/marketing-analytics-period";
import type {
  AdminResourceClickAnalytics,
  ResourceClickCampaignRow,
  ResourceClickCreativeRow,
  ResourceClickPageRow,
  ResourceClickRow,
  ResourceClickSourceRow,
} from "@/lib/admin/resource-clicks-types";

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
      }).format(day)
    );
  }
  return { keys, labels };
}

function number(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

export async function getResourceClickAnalytics(
  selection: DashboardRangeSelection
): Promise<AdminResourceClickAnalytics> {
  await connectDb();
  const range = resolveDashboardRange(selection);
  const { start, end } = range;
  const dateMatch = { createdAt: { $gte: start, $lt: end } };
  const hasValue = { $nin: ["", null] };

  const [
    clicks,
    linkOpens,
    downloads,
    outbound,
    email,
    affiliate,
    visitorKeys,
    sourceKeys,
    campaignKeys,
    trendRows,
    sourceRows,
    campaignRows,
    creativeRows,
    pageRows,
    recentRows,
  ] = await Promise.all([
    LinkClick.countDocuments(dateMatch),
    LinkClick.countDocuments({ ...dateMatch, kind: "resource_open" }),
    LinkClick.countDocuments({ ...dateMatch, kind: "resource_download" }),
    LinkClick.countDocuments({ ...dateMatch, kind: "outbound" }),
    LinkClick.countDocuments({ ...dateMatch, kind: "email" }),
    LinkClick.countDocuments({ ...dateMatch, kind: "affiliate" }),
    LinkClick.distinct("visitorKey", dateMatch),
    LinkClick.distinct("source", { ...dateMatch, source: hasValue }),
    LinkClick.distinct("campaign", { ...dateMatch, campaign: hasValue }),
    LinkClick.aggregate<{ _id: string; clicks: number }>([
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
    LinkClick.aggregate<{
      _id: { source: string; medium: string };
      clicks: number;
      visitors: string[];
    }>([
      { $match: dateMatch },
      {
        $group: {
          _id: {
            source: { $ifNull: ["$source", "direct"] },
            medium: { $ifNull: ["$medium", "direct"] },
          },
          clicks: { $sum: 1 },
          visitors: { $addToSet: "$visitorKey" },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
    ]),
    LinkClick.aggregate<{ _id: string; source: string; clicks: number; visitors: string[] }>([
      { $match: { ...dateMatch, campaign: hasValue } },
      {
        $group: {
          _id: "$campaign",
          source: { $first: "$source" },
          clicks: { $sum: 1 },
          visitors: { $addToSet: "$visitorKey" },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 8 },
    ]),
    LinkClick.aggregate<{ _id: string; clicks: number; visitors: string[] }>([
      {
        $match: {
          ...dateMatch,
          $or: [{ content: hasValue }, { adId: hasValue }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$content", ""] }, { $ifNull: ["$adId", ""] }, "$content"],
          },
          clicks: { $sum: 1 },
          visitors: { $addToSet: "$visitorKey" },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 8 },
    ]),
    LinkClick.aggregate<{ _id: Types.ObjectId | null; clicks: number; visitors: string[] }>([
      {
        $match: {
          ...dateMatch,
          resource: { $ne: null },
          kind: { $in: ["resource_open", "resource_download"] },
        },
      },
      {
        $group: {
          _id: "$resource",
          clicks: { $sum: 1 },
          visitors: { $addToSet: "$visitorKey" },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 8 },
    ]),
    LinkClick.find(dateMatch).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const resourceIds: Types.ObjectId[] = [
    ...pageRows.flatMap((row) => (row._id ? [row._id] : [])),
    ...recentRows.flatMap((row) => (row.resource ? [row.resource] : [])),
  ];
  const userIds: Types.ObjectId[] = recentRows.flatMap((row) => (row.user ? [row.user] : []));

  const [resourceDocs, userDocs] = await Promise.all([
    resourceIds.length > 0
      ? Resource.find({ _id: { $in: resourceIds } })
          .select("title")
          .lean()
      : Promise.resolve([]),
    userIds.length > 0
      ? User.find({ _id: { $in: userIds } })
          .select("email")
          .lean()
      : Promise.resolve([]),
  ]);

  const titles = new Map(resourceDocs.map((doc) => [String(doc._id), doc.title ?? "Untitled"]));
  const emails = new Map(userDocs.map((doc) => [String(doc._id), doc.email ?? ""]));

  const { keys, labels } = daySeries(start, end);
  const trendByKey = new Map(trendRows.map((row) => [row._id, number(row.clicks)]));

  const topSources: ResourceClickSourceRow[] = sourceRows.map((row) => ({
    source: text(row._id.source) || "direct",
    medium: text(row._id.medium) || "direct",
    clicks: number(row.clicks),
    visitors: new Set(row.visitors.filter(Boolean)).size,
  }));

  const topCampaigns: ResourceClickCampaignRow[] = campaignRows.map((row) => ({
    campaign: text(row._id),
    source: text(row.source) || "direct",
    clicks: number(row.clicks),
    visitors: new Set(row.visitors.filter(Boolean)).size,
  }));

  const topCreatives: ResourceClickCreativeRow[] = creativeRows
    .filter((row) => text(row._id))
    .map((row) => ({
      creative: text(row._id),
      clicks: number(row.clicks),
      visitors: new Set(row.visitors.filter(Boolean)).size,
    }));

  const topPages: ResourceClickPageRow[] = pageRows
    .filter((row) => row._id)
    .map((row) => {
      const resourceId = String(row._id);
      return {
        resourceId,
        title: titles.get(resourceId) ?? "Untitled",
        path: `/resources/${resourceId}`,
        clicks: number(row.clicks),
        visitors: new Set(row.visitors.filter(Boolean)).size,
      };
    });

  const recent: ResourceClickRow[] = recentRows.map((row) => {
    const resourceId = row.resource ? String(row.resource) : "";
    const userId = row.user ? String(row.user) : "";
    return {
      id: row._id.toString(),
      createdAt: row.createdAt.toISOString(),
      source: row.source || "direct",
      medium: row.medium || "direct",
      campaign: row.campaign || "",
      adsetId: row.adsetId || "",
      adId: row.adId || "",
      content: row.content || "",
      kind: row.kind || "outbound",
      page: row.page || row.label || "",
      landingPage: row.landingPage || "",
      referrer: row.referrer || "",
      resourceId,
      resourceTitle:
        titles.get(resourceId) ?? (row.label || row.destination || "Outbound link"),
      visitor: userId ? emails.get(userId) || "Member" : "Guest",
    };
  });

  return {
    period: range.period,
    range: { from: range.from, to: range.to, days: range.days, label: range.label },
    metrics: {
      clicks,
      linkOpens,
      downloads,
      outbound,
      email,
      affiliate,
      uniqueVisitors: visitorKeys.filter(Boolean).length,
      sources: sourceKeys.filter(Boolean).length,
      campaigns: campaignKeys.filter(Boolean).length,
    },
    trend: {
      labels,
      clicks: keys.map((key) => trendByKey.get(key) ?? 0),
    },
    topSources,
    topCampaigns,
    topCreatives,
    topPages,
    recent,
  };
}
