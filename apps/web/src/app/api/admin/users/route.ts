import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { SeminarRegistration } from "@/lib/models/seminar";
import { ResourceDownload } from "@/lib/models/resource-download";
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

    const sortKey = SORT_MAP[sort] ?? SORT_MAP.newest;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort(sortKey)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const userIds = users.map((u) => u._id);
    const [regCounts, dlCounts] = await Promise.all([
      SeminarRegistration.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      ResourceDownload.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
    ]);
    const regMap = new Map(regCounts.map((r) => [r._id.toString(), r.count as number]));
    const dlMap = new Map(dlCounts.map((r) => [r._id.toString(), r.count as number]));

    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const [totalUsers, paidUsers, admins, moderators, newThisWeek] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscription: "paid" }),
      User.countDocuments({ accountType: "admin" }),
      User.countDocuments({ accountType: "moderator" }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        paidUsers,
        freeUsers: totalUsers - paidUsers,
        admins,
        moderators,
        newThisWeek,
      },
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone ?? null,
        avatar: u.avatar ?? null,
        accountType: u.accountType,
        subscription: u.subscription,
        createdAt: u.createdAt,
        seminars: regMap.get(u._id.toString()) ?? 0,
        downloads: dlMap.get(u._id.toString()) ?? 0,
      })),
      pagination: { page, perPage, total },
    });
  } catch (error) {
    console.error("admin/users error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
