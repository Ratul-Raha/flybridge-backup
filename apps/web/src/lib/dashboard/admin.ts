import "server-only";

import { unstable_cache } from "next/cache";
import { REPORT_REGISTRY, requireAdminReport } from "@/lib/reporting";
import { getOrdersStats, type OrderStats } from "@/lib/admin/orders-stats";

export type AdminSignup = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  accountType: string;
  createdAt: string;
};

export type AdminActivityItem = {
  id: string;
  type: "signup" | "registration" | "seminar";
  text: string;
  sub: string;
  avatar: string | null;
  at: string;
};

export type AdminDashboardData = {
  overview: Awaited<ReturnType<typeof REPORT_REGISTRY.overview>>;
  growth: Awaited<ReturnType<typeof REPORT_REGISTRY.growth>>;
  signups: AdminSignup[];
  activity: AdminActivityItem[];
  orders: OrderStats;
};

const getCachedAdminDashboardData = unstable_cache(
  async (): Promise<AdminDashboardData> => {
    const [overview, growth, signups, activity, orders] = await Promise.all([
      REPORT_REGISTRY.overview(),
      REPORT_REGISTRY.growth({ days: 14 }),
      REPORT_REGISTRY["recent-signups"](),
      REPORT_REGISTRY["platform-activity"](),
      getOrdersStats("USD"),
    ]);

    return {
      overview,
      growth,
      signups: signups.signups.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      activity: activity.activity.map((a) => ({
        ...a,
        at: a.at.toISOString(),
      })),
      orders,
    };
  },
  ["admin", "dashboard"],
  { revalidate: 60 }
);

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireAdminReport();
  return getCachedAdminDashboardData();
}
