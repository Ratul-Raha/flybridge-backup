import "server-only";

import { unstable_cache } from "next/cache";
import { REPORT_REGISTRY, requireAdminReport } from "@/lib/reporting";

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

export type AdminDashboardActivity = {
  signups: AdminSignup[];
  activity: AdminActivityItem[];
};

const getCachedAdminDashboardActivity = unstable_cache(
  async (): Promise<AdminDashboardActivity> => {
    const [signups, activity] = await Promise.all([
      REPORT_REGISTRY["recent-signups"](),
      REPORT_REGISTRY["platform-activity"](),
    ]);

    return {
      signups: signups.signups.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      activity: activity.activity.map((a) => ({
        ...a,
        at: a.at.toISOString(),
      })),
    };
  },
  ["admin", "dashboard-activity"],
  { revalidate: 60 }
);

export async function getAdminDashboardActivity(): Promise<AdminDashboardActivity> {
  await requireAdminReport();
  return getCachedAdminDashboardActivity();
}
