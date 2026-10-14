import type { SupportedCurrency } from "@/lib/pricing";
import type { DashboardPeriod } from "@/lib/admin/dashboard-range";

export type OverviewMetrics = {
  totalMembers: number;
  newSignups: number;
  activeMembers: number;
  activeCourseMembers: number;
  engagementRate: number;
  courseEnrollments: number;
  courseCompletions: number;
  lessonViews: number;
  quizStarts: number;
  quizAttempts: number;
  averageQuizScore: number;
  mockTestAttempts: number;
  readinessChecks: number;
  seminarRegistrations: number;
  orders: number;
  completedOrders: number;
  revenue: number;
};

export type OverviewItem = {
  title: string;
  itemType: string;
  orders: number;
  revenue: number;
  avgPrice: number;
};

export type OverviewRecentOrder = {
  id: string;
  userName: string;
  userEmail: string;
  itemTitle: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminOverviewAnalytics = {
  period: DashboardPeriod;
  currency: SupportedCurrency;
  range: { from: string; to: string; days: number; label: string };
  metrics: OverviewMetrics;
  growth: { labels: string[]; signups: number[] };
  orderTrend: { labels: string[]; counts: number[]; revenues: number[] };
  orderStatuses: { status: string; count: number }[];
  topItems: OverviewItem[];
  recentOrders: OverviewRecentOrder[];
};

export type UsageRankedPage = { path: string; views: number; members: number };

export type UsageRankedLesson = {
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  views: number;
  members: number;
};

export type UsageRankedQuiz = {
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  attempts: number;
  members: number;
  averageScore: number;
};

export type AdminUsageAnalytics = AdminOverviewAnalytics & {
  usageTrend: {
    labels: string[];
    pageViews: number[];
    lessonViews: number[];
    quizStarts: number[];
    quizAttempts: number[];
    activeMembers: number[];
  };
  topPages: UsageRankedPage[];
  topLessons: UsageRankedLesson[];
  topQuizzes: UsageRankedQuiz[];
};
