import type { DashboardPeriod } from "@/lib/admin/dashboard-range";

export type EmailSendCampaignRow = {
  campaign: string;
  /** Send operations for this campaign. */
  sends: number;
  /** Total recipient emails sent. */
  recipients: number;
  /** Tracked link clicks attributed to this campaign. */
  clicks: number;
  /** Distinct recipients who clicked. */
  uniqueRecipients: number;
  /** clicks ÷ recipients. */
  avgClicksPerEmail: number;
  /** uniqueRecipients ÷ recipients (percent). */
  clickRate: number;
};

export type EmailSendRow = {
  id: string;
  kind: string;
  campaign: string;
  templateId: string;
  subject: string;
  recipients: number;
  status: string;
  error: string;
  createdAt: string;
};

export type AdminEmailSendAnalytics = {
  period: DashboardPeriod;
  range: { from: string; to: string; days: number; label: string };
  metrics: {
    sent: number;
    operations: number;
    clicks: number;
    uniqueRecipients: number;
    avgClicksPerEmail: number;
    clickRate: number;
  };
  trend: { labels: string[]; sent: number[]; clicks: number[] };
  campaigns: EmailSendCampaignRow[];
  recent: EmailSendRow[];
};
