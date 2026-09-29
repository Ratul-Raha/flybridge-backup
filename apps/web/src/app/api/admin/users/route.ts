import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { SeminarRegistration } from "@/lib/models/seminar";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { CourseProgress } from "@/lib/models/course-progress";
import { buildUserFilter, userSortKey } from "@/lib/admin/user-filter";

/** Upper bound for "select all matching" — matches the bulk action limits. */
const MAX_SELECT = 1000;

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage")) || 15));

    const filter = await buildUserFilter(searchParams);

    // Lightweight mode used by the table's "select all" checkbox: resolves every
    // user matching the current filters (not just the visible page) so bulk
    // actions can target the whole result set.
    if (searchParams.get("idsOnly") === "1") {
      const total = await User.countDocuments(filter);
      const matched = await User.find(filter, { name: 1, email: 1 })
        .sort(userSortKey(sort))
        .limit(MAX_SELECT)
        .lean();
      return NextResponse.json({
        users: matched.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
        })),
        total,
        truncated: total > matched.length,
        limit: MAX_SELECT,
      });
    }

    const sortKey = userSortKey(sort);

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
    const availableCourses = await Course.find({}, { title: 1 })
      .sort({ title: 1 })
      .limit(300)
      .lean();
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
          signupSource: u.signupSource ?? null,
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
      courses: availableCourses.map((c) => ({ id: c._id.toString(), title: c.title })),
    });
  } catch (error) {
    console.error("admin/users error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
