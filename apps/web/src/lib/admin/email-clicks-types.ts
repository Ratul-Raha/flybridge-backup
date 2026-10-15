import type { DashboardPeriod } from "@/lib/admin/dashboard-range";

export type EmailClickMetrics = {
  clicks: number;
  uniqueRecipients: number;
  uniqueCampaigns: number;
  uniqueDestinations: number;
  clicksPerRecipient: number;
};

export type EmailClickCampaign = {
  campaign: string;
  clicks: number;
  recipients: number;
};

export type EmailClickTemplate = {
  templateId: string;
  clicks: number;
  recipients: number;
};

export type EmailClickDestination = {
  destination: string;
  clicks: number;
  recipients: number;
};

export type EmailClickRow = {
  id: string;
  campaign: string;
  templateId: string;
  recipient: string;
  destination: string;
  referrer: string;
  createdAt: string;
};

export type AdminEmailClickAnalytics = {
  period: DashboardPeriod;
  range: { from: string; to: string; days: number; label: string };
  metrics: EmailClickMetrics;
  trend: { labels: string[]; clicks: number[] };
  topCampaigns: EmailClickCampaign[];
  topTemplates: EmailClickTemplate[];
  topDestinations: EmailClickDestination[];
  recent: EmailClickRow[];
};
