import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { CourseProgress } from "@/lib/models/course-progress";
import { QuizAttempt } from "@/lib/models/quiz-attempt";

export type LeaderboardEntry = {
  rank: number;
  user: {
    name: string;
    avatar: string | null;
  };
};

export type LeaderboardResult = {
  entries: LeaderboardEntry[];
  periodDays: number;
};

export type LeaderboardOptions = {
  limit?: number;
  periodDays?: number;
};

export type RankedUser = {
  userId: string;
  name: string;
  avatar: string | null;
  composite: number;
  weeklyActivity: number;
};

async function computeRankedUsers(periodDays: number): Promise<RankedUser[]> {
  await connectDb();

  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const progressAgg = await CourseProgress.aggregate([
    {
      $lookup: {
        from: User.collection.name,
        localField: "user",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    { $match: { "owner.accountType": "user" } },
    {
      $group: {
        _id: "$user",
        name: { $first: "$owner.name" },
        avatar: { $first: "$owner.avatar" },
        avgProgress: { $avg: { $ifNull: ["$overallPercentage", 0] } },
        quizPoints: {
          $sum: {
            $map: {
              input: { $ifNull: ["$quizScores", []] },
              as: "q",
              in: { $divide: [{ $ifNull: ["$$q.score", 0] }, 100] },
            },
          },
        },
      },
    },
    { $sort: { avgProgress: -1 } },
    { $limit: 10000 },
  ]);

  const progressById = new Map(
    progressAgg.map((p) => [
      p._id.toString(),
      {
        userId: p._id.toString(),
        name: p.name,
        avatar: p.avatar ?? null,
        avgProgress: Math.round((p.avgProgress ?? 0) * 10) / 10,
        quizPoints: Math.round((p.quizPoints ?? 0) * 100) / 100,
      },
    ])
  );

  const weeklyAgg = await QuizAttempt.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$user",
        activity: { $sum: { $divide: [{ $ifNull: ["$score", 0] }, 100] } },
      },
    },
  ]);

  const weeklyById = new Map(
    weeklyAgg.map((w) => [w._id.toString(), Math.round((w.activity ?? 0) * 100) / 100])
  );

  const rows: Array<{
    userId: string;
    name: string;
    avatar: string | null;
    composite: number;
    weeklyActivity: number;
  }> = [];

  for (const [userId, p] of progressById) {
    const weekly = weeklyById.get(userId) ?? 0;
    rows.push({
      userId,
      name: p.name,
      avatar: p.avatar,
      composite: Math.round((p.avgProgress + p.quizPoints) * 100) / 100,
      weeklyActivity: weekly,
    });
  }

  rows.sort((a, b) => b.composite - a.composite || b.weeklyActivity - a.weeklyActivity);

  return rows;
}

export async function computeLeaderboard(
  options: LeaderboardOptions = {}
): Promise<LeaderboardResult> {
  const { limit = 5, periodDays = 7 } = options;

  const rows = await computeRankedUsers(periodDays);

  const entries: LeaderboardEntry[] = rows.slice(0, limit).map((r, i) => ({
    rank: i + 1,
    user: { name: r.name, avatar: r.avatar },
  }));

  return { entries, periodDays };
}

export type MyRankResult = {
  rank: number | null;
  total: number;
  my: {
    name: string;
    avatar: string | null;
    composite: number;
    weeklyActivity: number;
  } | null;
  top: LeaderboardEntry[];
};

export async function computeMyRank(
  userId: string,
  options: Pick<LeaderboardOptions, "periodDays"> = {}
): Promise<MyRankResult> {
  const { periodDays = 7 } = options;

  const rows = await computeRankedUsers(periodDays);

  const rankIndex = rows.findIndex((r) => r.userId === userId);
  const top = rows.slice(0, 5).map((r, i) => ({
    rank: i + 1,
    user: { name: r.name, avatar: r.avatar },
  }));

  const myRow = rankIndex >= 0 ? rows[rankIndex] : null;

  return {
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    total: rows.length,
    my: myRow
      ? {
          name: myRow.name,
          avatar: myRow.avatar,
          composite: myRow.composite,
          weeklyActivity: myRow.weeklyActivity,
        }
      : null,
    top,
  };
}