import type { DashboardPeriod } from "@/lib/admin/dashboard-range";

export type ResourceClickMetrics = {
  clicks: number;
  linkOpens: number;
  downloads: number;
  uniqueVisitors: number;
  sources: number;
  campaigns: number;
  outbound: number;
  email: number;
  affiliate: number;
};

export type ResourceClickSourceRow = {
  source: string;
  medium: string;
  clicks: number;
  visitors: number;
};

export type ResourceClickCampaignRow = {
  campaign: string;
  source: string;
  clicks: number;
  visitors: number;
};

export type ResourceClickCreativeRow = {
  creative: string;
  clicks: number;
  visitors: number;
};

export type ResourceClickPageRow = {
  resourceId: string;
  title: string;
  path: string;
  clicks: number;
  visitors: number;
};

export type ResourceClickRow = {
  id: string;
  createdAt: string;
  source: string;
  medium: string;
  campaign: string;
  adsetId: string;
  adId: string;
  content: string;
  kind: string;
  page: string;
  landingPage: string;
  referrer: string;
  resourceId: string;
  resourceTitle: string;
  visitor: string;
};

export type AdminResourceClickAnalytics = {
  period: DashboardPeriod;
  range: { from: string; to: string; days: number; label: string };
  metrics: ResourceClickMetrics;
  trend: { labels: string[]; clicks: number[] };
  topSources: ResourceClickSourceRow[];
  topCampaigns: ResourceClickCampaignRow[];
  topCreatives: ResourceClickCreativeRow[];
  topPages: ResourceClickPageRow[];
  recent: ResourceClickRow[];
};
