import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { SeminarRegistration } from "@/lib/models/seminar";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { CourseProgress } from "@/lib/models/course-progress";
import { ACCOUNT_TYPES, SUBSCRIPTION_TYPES } from "@/lib/roles";

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  "name-desc": { name: -1 },
};

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

    const searchParams = request.nextUrl.searchParams;
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const accountType = searchParams.get("accountType") ?? "";
    const subscription = searchParams.get("subscription") ?? "";
    const certDownloaded = searchParams.get("certificateDownloaded") ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage")) || 15));

    const filter: Record<string, unknown> = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }
    if (accountType && (ACCOUNT_TYPES as string[]).includes(accountType)) filter.accountType = accountType;
    if (subscription && (SUBSCRIPTION_TYPES as string[]).includes(subscription)) filter.subscription = subscription;

    // Pre-compute the set of users who downloaded a certificate so we can
    // filter on it without leaking the CourseProgress layout into the User query.
    let downloadedUserIds: string[] | null = null;
    if (certDownloaded === "yes" || certDownloaded === "only") {
      const downloaded = await CourseProgress.find(
        { certificateDownloadCount: { $gt: 0 } },
        { user: 1 }
      ).lean();
      downloadedUserIds = downloaded.map((p) => p.user.toString());
    }

    if (certDownloaded === "yes") {
      filter._id = { $in: downloadedUserIds };
    } else if (certDownloaded === "only") {
      filter._id = { $in: downloadedUserIds };
    }

    const sortKey = SORT_MAP[sort] ?? SORT_MAP.newest;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort(sortKey)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const userIds = users.map((u) => u._id);
    const [enrollCounts, regCounts, dlCounts, readinessAgg, certProgress] = await Promise.all([
      CourseEnrollment.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      SeminarRegistration.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      ResourceDownload.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      ReadinessRun.aggregate([
        { $match: { user: { $in: userIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$user",
            score: { $first: "$score" },
            runs: { $sum: 1 },
          },
        },
      ]),
      CourseProgress.find({ user: { $in: userIds } }).lean(),
    ]);
    const enrollMap = new Map(enrollCounts.map((r) => [r._id.toString(), r.count as number]));
    const regMap = new Map(regCounts.map((r) => [r._id.toString(), r.count as number]));
    const dlMap = new Map(dlCounts.map((r) => [r._id.toString(), r.count as number]));
    const readinessMap = new Map(
      readinessAgg.map((r) => [r._id.toString(), r as { score: number; runs: number }])
    );
    const certCountMap = new Map<string, { count: number; downloaded: boolean }>();
    for (const p of certProgress as {
      user: { toString(): string };
      certificateDownloadCount?: number;
    }[]) {
      const uid = p.user.toString();
      const prev = certCountMap.get(uid) ?? { count: 0, downloaded: false };
      prev.count += 1;
      if ((p.certificateDownloadCount ?? 0) > 0) prev.downloaded = true;
      certCountMap.set(uid, prev);
    }

    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const [
      totalUsers,
      paidUsers,
      admins,
      moderators,
      newThisWeek,
      totalReadiness,
      certDownloaders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscription: "paid" }),
      User.countDocuments({ accountType: "admin" }),
      User.countDocuments({ accountType: "moderator" }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      ReadinessRun.countDocuments(),
      CourseProgress.distinct("user", { certificateDownloadCount: { $gt: 0 } }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        paidUsers,
        freeUsers: totalUsers - paidUsers,
        admins,
        moderators,
        newThisWeek,
        totalReadiness,
        certDownloaders: certDownloaders.length,
      },
      users: users.map((u) => {
        const readiness = readinessMap.get(u._id.toString());
        const cert = certCountMap.get(u._id.toString()) ?? {
          count: 0,
          downloaded: false,
        };
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          phone: u.phone ?? null,
          avatar: u.avatar ?? null,
          accountType: u.accountType,
          subscription: u.subscription,
          createdAt: u.createdAt,
          seminars: regMap.get(u._id.toString()) ?? 0,
          courses: enrollMap.get(u._id.toString()) ?? 0,
          downloads: dlMap.get(u._id.toString()) ?? 0,
          certificates: cert.count,
          certificateDownloaded: cert.downloaded,
          readiness: readiness?.score ?? null,
          readinessRuns: readiness?.runs ?? 0,
        };
      }),
      pagination: { page, perPage, total },
    });
  } catch (error) {
    console.error("admin/users error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
