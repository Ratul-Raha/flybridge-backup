import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { User } from "@/lib/models/user";

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  score: { score: -1 },
  "score-asc": { score: 1 },
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
    const minScore = Number(searchParams.get("minScore")) || null;
    const country = (searchParams.get("country") ?? "").trim().toLowerCase();
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage")) || 15));

    let userIds: string[] | null = null;
    if (q) {
      const users = await User.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();
      userIds = users.map((u) => u._id.toString());
      if (userIds.length === 0) {
        return NextResponse.json({ runs: [], pagination: { page, perPage, total: 0 } });
      }
    }

    const filter: Record<string, unknown> = {};
    if (userIds) filter.user = { $in: userIds };
    if (minScore) filter.score = { $gte: minScore };
    if (country) filter.country = { $regex: country, $options: "i" };

    const sortKey = SORT_MAP[sort] ?? SORT_MAP.newest;

    const total = await ReadinessRun.countDocuments(filter);
    const runs = await ReadinessRun.find(filter)
      .sort(sortKey)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("user", "name email avatar")
      .lean();

    const categories = runs.map((r) => {
      const result = r.result as
        | { categories?: { id: string; label?: string; pct?: number }[] }
        | null
        | undefined;
      return result?.categories ?? [];
    });

    return NextResponse.json({
      runs: runs.map((r, i) => {
        const user = r.user as
          | { _id?: { toString(): string }; name?: string; email?: string; avatar?: string }
          | null
          | undefined;
        return {
          id: r._id.toString(),
          score: r.score,
          label: r.label ?? "",
          country: r.country ?? "",
          degreeLevel: r.degreeLevel ?? "",
          createdAt: r.createdAt,
          user: user
            ? {
                id: user._id ? user._id.toString() : "",
                name: user.name ?? "Deleted user",
                email: user.email ?? "",
                avatar: user.avatar ?? null,
              }
            : null,
          categories: (categories[i] ?? []).map((c) => ({
            id: c.id,
            label: c.label ?? "",
            pct: c.pct ?? 0,
          })),
        };
      }),
      pagination: { page, perPage, total },
    });
  } catch (error) {
    console.error("admin/readiness error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}