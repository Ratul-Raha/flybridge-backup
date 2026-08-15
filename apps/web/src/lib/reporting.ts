import "server-only";

import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { ReadinessRun } from "@/lib/models/readiness-run";

export type ReportContext = { days: number };

export class ReportError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireAdminReport() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    throw new ReportError(403, "Forbidden");
  }
}

function lastNDays(n: number) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (n - 1));
  return from;
}

async function reportOverview() {
  await connectDb();
  const [totalUsers, activeSubscriptions, courseEnrollment, readinessRuns] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ subscription: "paid" }),
    SeminarRegistration.countDocuments(),
    ReadinessRun.countDocuments(),
  ]);

  const paidRegs = await SeminarRegistration.aggregate([
    {
      $lookup: {
        from: Seminar.collection.name,
        localField: "seminar",
        foreignField: "_id",
        as: "sem",
      },
    },
    { $unwind: { path: "$sem", preserveNullAndEmptyArrays: true } },
    { $match: { "sem.type": "paid" } },
    { $count: "n" },
  ]);

  return {
    totalUsers,
    activeSubscriptions,
    totalOrders: paidRegs[0]?.n ?? 0,
    courseEnrollment,
    readinessRuns,
  };
}

async function reportGrowth({ days }: ReportContext) {
  await connectDb();
  const from = lastNDays(days);

  const agg = await User.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDay = new Map(agg.map((d) => [d._id, d.count]));

  const labels: string[] = [];
  const signups: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    signups.push(byDay.get(key) ?? 0);
  }

  return { labels, signups };
}

async function reportTopCourses() {
  await connectDb();
  const courses = await SeminarRegistration.aggregate([
    {
      $lookup: {
        from: Seminar.collection.name,
        localField: "seminar",
        foreignField: "_id",
        as: "sem",
      },
    },
    { $unwind: "$sem" },
    {
      $group: {
        _id: "$seminar",
        joinees: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ["$sem.type", "paid"] }, 1, 0] } },
      },
    },
    { $sort: { joinees: -1 } },
    { $limit: 5 },
  ]);

  return {
    courses: courses.map((c) => ({
      id: c._id.toString(),
      title: c.sem.title,
      joinees: c.joinees,
      paid: c.paid,
    })),
  };
}

async function reportSubscriptionSplit() {
  await connectDb();
  const [free, paid] = await Promise.all([
    User.countDocuments({ subscription: "free" }),
    User.countDocuments({ subscription: "paid" }),
  ]);
  return { free, paid, total: free + paid };
}

async function reportRecentSignups() {
  await connectDb();
  const users = await User.find().sort({ createdAt: -1 }).limit(8).lean();
  return {
    signups: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      avatar: u.avatar ?? null,
      accountType: u.accountType,
      createdAt: u.createdAt,
    })),
  };
}

async function reportRecentOrders() {
  await connectDb();
  const orders = await SeminarRegistration.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("seminar", "title type price");

  const emails = [...new Set(orders.map((r) => r.email.toLowerCase()))];
  const users = await User.find({ email: { $in: emails } })
    .select("email avatar")
    .lean();
  const avatarByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.avatar ?? null]));

  return {
    orders: orders.map((r) => {
      const sem = r.seminar as unknown as {
        _id: unknown;
        title?: string;
        type?: string;
        price?: number;
      } | null;
      return {
        id: r._id.toString(),
        name: r.name,
        email: r.email,
        avatar: avatarByEmail.get(r.email.toLowerCase()) ?? null,
        seminar: sem?.title ?? "Unknown seminar",
        type: sem?.type ?? "free",
        price: sem?.price ?? 0,
        createdAt: r.createdAt,
      };
    }),
  };
}

async function reportPlatformActivity() {
  await connectDb();
  const [signups, registrations, seminars] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(3).lean(),
    SeminarRegistration.find().sort({ createdAt: -1 }).limit(4).populate("seminar", "title"),
    Seminar.find().sort({ createdAt: -1 }).limit(2).lean(),
  ]);

  const activity: {
    id: string;
    type: "signup" | "registration" | "seminar";
    text: string;
    sub: string;
    avatar: string | null;
    at: Date;
  }[] = [];

  for (const u of signups) {
    activity.push({
      id: `s-${u._id.toString()}`,
      type: "signup",
      text: `${u.name} joined the platform`,
      sub: "New signup",
      avatar: u.avatar ?? null,
      at: u.createdAt,
    });
  }
  for (const r of registrations) {
    const sem = r.seminar as unknown as { _id: unknown; title?: string } | null;
    activity.push({
      id: `r-${r._id.toString()}`,
      type: "registration",
      text: `${r.name} registered for "${sem?.title ?? "a seminar"}"`,
      sub: "New registration",
      avatar: null,
      at: r.createdAt,
    });
  }
  for (const s of seminars) {
    activity.push({
      id: `e-${s._id.toString()}`,
      type: "seminar",
      text: `"${s.title}" was created`,
      sub: "New seminar",
      avatar: null,
      at: s.createdAt,
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());

  return { activity: activity.slice(0, 8) };
}

export const REPORT_REGISTRY = {
  overview: reportOverview,
  growth: reportGrowth,
  "top-courses": reportTopCourses,
  "subscription-split": reportSubscriptionSplit,
  "recent-signups": reportRecentSignups,
  "recent-orders": reportRecentOrders,
  "platform-activity": reportPlatformActivity,
} as const;

export type ReportName = keyof typeof REPORT_REGISTRY;
export type ReportPayload<N extends ReportName> = Awaited<ReturnType<(typeof REPORT_REGISTRY)[N]>>;
