import "server-only";

import { connectDb } from "@/lib/db";
import { EmailSend } from "@/lib/models/email-send";
import { EmailClick } from "@/lib/models/email-click";
import { resolveDashboardRange, type DashboardRangeSelection } from "@/lib/admin/dashboard-range";
import { MARKETING_REPORT_TIME_ZONE, marketingDateKey } from "@/lib/marketing-analytics-period";
import type { AdminEmailSendAnalytics, EmailSendCampaignRow, EmailSendRow } from "@/lib/admin/email-sends-types";

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

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function getEmailSendAnalytics(
  selection: DashboardRangeSelection,
): Promise<AdminEmailSendAnalytics> {
  await connectDb();
  const range = resolveDashboardRange(selection);
  const { start, end } = range;
  const dateMatch = { createdAt: { $gte: start, $lt: end } };

  const [
    operations,
    sentAgg,
    clickAgg,
    uniqueRecipients,
    sentTrend,
    clickTrend,
    campaignSendRows,
    campaignClickRows,
    recentDocs,
  ] = await Promise.all([
    EmailSend.countDocuments(dateMatch),
    EmailSend.aggregate<{ _id: null; recipients: number }>([
      { $match: dateMatch },
      { $group: { _id: null, recipients: { $sum: "$recipients" } } },
    ]),
    EmailClick.countDocuments(dateMatch),
    EmailClick.distinct("recipient", { ...dateMatch, recipient: { $nin: ["", null] } }),
    EmailSend.aggregate<{ _id: string; recipients: number }>([
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
          recipients: { $sum: "$recipients" },
        },
      },
    ]),
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
    EmailSend.aggregate<{ _id: string; sends: number; recipients: number }>([
      { $match: dateMatch },
      {
        $group: {
          _id: "$campaign",
          sends: { $sum: 1 },
          recipients: { $sum: "$recipients" },
        },
      },
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
    ]),
    EmailSend.find(dateMatch).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const sent = number(sentAgg[0]?.recipients);
  const clicks = number(clickAgg);
  const uniqueRecipientsCount = uniqueRecipients.length;

  const { keys, labels } = daySeries(start, end);
  const sentByKey = new Map(sentTrend.map((row) => [row._id, number(row.recipients)]));
  const clickByKey = new Map(clickTrend.map((row) => [row._id, number(row.clicks)]));

  const clickMap = new Map(campaignClickRows.map((row) => [row._id || "email", row]));
  const campaigns: EmailSendCampaignRow[] = campaignSendRows
    .map((row) => {
      const campaign = row._id || "email";
      const clickRow = clickMap.get(campaign);
      const c = number(clickRow?.clicks);
      const members = clickRow ? new Set(clickRow.members.filter(Boolean)) : new Set<string>();
      const recipients = number(row.recipients);
      return {
        campaign,
        sends: number(row.sends),
        recipients,
        clicks: c,
        uniqueRecipients: members.size,
        avgClicksPerEmail: recipients > 0 ? round1(c / recipients) : 0,
        clickRate: recipients > 0 ? round1((members.size / recipients) * 100) : 0,
      };
    })
    .sort((a, b) => b.recipients - a.recipients);

  const recent: EmailSendRow[] = recentDocs.map((row) => ({
    id: (row as { _id: unknown })._id?.toString() ?? "",
    kind: row.kind || "transactional",
    campaign: row.campaign || "email",
    templateId: row.templateId ?? "",
    subject: row.subject ?? "",
    recipients: number(row.recipients),
    status: row.status || "sent",
    error: row.error ?? "",
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    period: range.period,
    range: { from: range.from, to: range.to, days: range.days, label: range.label },
    metrics: {
      sent,
      operations: number(operations),
      clicks,
      uniqueRecipients: uniqueRecipientsCount,
      avgClicksPerEmail: sent > 0 ? round1(clicks / sent) : 0,
      clickRate: sent > 0 ? round1((uniqueRecipientsCount / sent) * 100) : 0,
    },
    trend: {
      labels,
      sent: keys.map((key) => sentByKey.get(key) ?? 0),
      clicks: keys.map((key) => clickByKey.get(key) ?? 0),
    },
    campaigns,
    recent,
  };
}
