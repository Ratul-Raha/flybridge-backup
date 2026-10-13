import type { MarketingPeriod } from "@/lib/marketing-analytics-period";
import type { SupportedCurrency } from "@/lib/pricing";

export type MarketingTotals = {
  paidOrders: number;
  freeOrders: number;
  grossRevenue: number;
  refunds: number;
  refundedOrders: number;
  netCash: number;
  averageOrderValue: number;
  leads: number;
};

export type MarketingTrendPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

export type MarketingSourceRow = {
  source: string;
  medium: string;
  campaign: string;
  campaignId: string;
  orders: number;
  revenue: number;
  leads: number;
};

export type MarketingProductRow = {
  title: string;
  itemType: string;
  orders: number;
  revenue: number;
};

export type MarketingCouponRow = {
  code: string;
  orders: number;
  savings: number;
};

export type MetaPurchaseHealth = {
  configured: boolean;
  reported: number;
  failed: number;
  unreported: number;
};

export type MarketingAnalyticsData = {
  period: MarketingPeriod;
  currency: SupportedCurrency;
  start: string;
  end: string;
  current: MarketingTotals;
  previous: MarketingTotals;
  trend: MarketingTrendPoint[];
  sources: MarketingSourceRow[];
  products: MarketingProductRow[];
  coupons: MarketingCouponRow[];
  meta: MetaPurchaseHealth;
};
