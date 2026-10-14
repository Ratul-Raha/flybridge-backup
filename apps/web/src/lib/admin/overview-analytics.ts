import "server-only";

import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Order } from "@/lib/models/order";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { QuizAttempt } from "@/lib/models/quiz-attempt";
import { MockTestAttempt } from "@/lib/models/mock-test-attempt";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { SeminarRegistration } from "@/lib/models/seminar";
import { UsageEvent } from "@/lib/models/usage-event";
import { MARKETING_REPORT_TIME_ZONE, marketingDateKey } from "@/lib/marketing-analytics-period";
import { resolveDashboardRange, type DashboardRangeSelection } from "@/lib/admin/dashboard-range";
import type {
  AdminOverviewAnalytics,
  AdminUsageAnalytics,
  OverviewItem,
  OverviewMetrics,
  OverviewRecentOrder,
  UsageRankedLesson,
  UsageRankedPage,
  UsageRankedQuiz,
} from "@/lib/admin/overview-analytics-types";
import type { SupportedCurrency } from "@/lib/pricing";

const DAY_MS = 24 * 60 * 60 * 1000;

function daySeries(start: Date, end: Date) {
  const keys: string[] = [];
  const labels: string[] = [];
  for (let day = new Date(start); day < end; day = new Date(day.getTime() + DAY_MS)) {
    keys.push(marketingDateKey(day));
    labels.push(
      new Intl.DateTimeFormat("en-US", {
        timeZone: MARKETING_REPORT_TIME_ZONE,
        month: "short",
        day: "numeric",
      }).format(day),
    );
  }
  return { keys, labels };
}

function number(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currencyMatch(currency: SupportedCurrency) {
  return { $in: [currency, currency.toLowerCase()] };
}

function completedOrderMatch(currency: SupportedCurrency, start: Date, end: Date) {
  return {
    currency: currencyMatch(currency),
    status: { $in: ["completed", "refunded"] },
    $or: [
      { completedAt: { $gte: start, $lt: end } },
      { completedAt: null, updatedAt: { $gte: start, $lt: end } },
    ],
  };
}

async function distinctActiveMembers(start: Date, end: Date): Promise<number> {
  const rows = await UsageEvent.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: "$user" } },
    {
      $unionWith: {
        coll: QuizAttempt.collection.name,
        pipeline: [
          { $match: { createdAt: { $gte: start, $lt: end } } },
          { $group: { _id: "$user" } },
        ],
      },
    },
    {
      $unionWith: {
        coll: CourseProgress.collection.name,
        pipeline: [
          { $match: { updatedAt: { $gte: start, $lt: end } } },
          { $group: { _id: "$user" } },
        ],
      },
    },
    { $group: { _id: "$_id" } },
    { $count: "count" },
  ]);
  return number(rows[0]?.count);
}

async function distinctCourseMembers(start: Date, end: Date): Promise<number> {
  const rows = await CourseProgress.aggregate([
    { $match: { updatedAt: { $gte: start, $lt: end } } },
    { $group: { _id: "$user" } },
    { $count: "count" },
  ]);
  return number(rows[0]?.count);
}

function mapItems(
  rows: {
    _id: { title?: string; itemType?: string };
    orders?: number;
    revenue?: number;
  }[],
): OverviewItem[] {
  return rows.map((row) => {
    const orders = number(row.orders);
    const revenue = number(row.revenue);
    return {
      title: row._id?.title || "Untitled",
      itemType: row._id?.itemType || "product",
      orders,
      revenue,
      avgPrice: orders > 0 ? Math.round(revenue / orders) : 0,
    };
  });
}

export async function getOverviewAnalytics(
  selection: DashboardRangeSelection,
  currency: SupportedCurrency,
): Promise<AdminOverviewAnalytics> {
  await connectDb();
  const range = resolveDashboardRange(selection);
  const { start, end } = range;

  const [
    totalMembers,
    signupRows,
    activeMembers,
    activeCourseMembers,
    courseEnrollments,
    courseCompletions,
    lessonViews,
    quizStarts,
    quizRows,
    mockTestAttempts,
    readinessChecks,
    seminarRegistrations,
    orderRows,
    orderTrendRows,
    statusRows,
    topItemRows,
    recentOrderRows,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: MARKETING_REPORT_TIME_ZONE,
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    distinctActiveMembers(start, end),
    distinctCourseMembers(start, end),
    CourseEnrollment.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    CourseProgress.countDocuments({ passed: true, updatedAt: { $gte: start, $lt: end } }),
    UsageEvent.countDocuments({ event: "lesson_view", createdAt: { $gte: start, $lt: end } }),
    UsageEvent.countDocuments({ event: "quiz_start", createdAt: { $gte: start, $lt: end } }),
    QuizAttempt.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
    ]),
    MockTestAttempt.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    ReadinessRun.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    SeminarRegistration.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    Order.aggregate([
      { $match: { currency: currencyMatch(currency), createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]),
    Order.aggregate([
      { $match: { currency: currencyMatch(currency), createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: MARKETING_REPORT_TIME_ZONE,
            },
          },
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$total", 0] },
          },
        },
      },
    ]),
    Order.aggregate([
      { $match: { currency: currencyMatch(currency), createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: completedOrderMatch(currency, start, end) },
      { $unwind: "$items" },
      {
        $group: {
          _id: { title: "$items.title", itemType: "$items.itemType" },
          orders: { $sum: 1 },
          revenue: { $sum: "$items.price" },
        },
      },
      { $sort: { revenue: -1, orders: -1 } },
      { $limit: 6 },
    ]),
    Order.find({ currency: currencyMatch(currency) })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name email")
      .lean(),
  ]);

  const revenueRows = await Order.aggregate([
    { $match: completedOrderMatch(currency, start, end) },
    { $group: { _id: null, revenue: { $sum: "$total" } } },
  ]);

  const orders = number(orderRows[0]?.orders);
  const completedOrders = number(orderRows[0]?.completedOrders);
  const revenue = number(revenueRows[0]?.revenue);
  const quizAttempts = number(quizRows[0]?.count);
  const averageQuizScore = Math.round(number(quizRows[0]?.avgScore));

  const metrics: OverviewMetrics = {
    totalMembers,
    newSignups: signupRows.reduce((total, row) => total + number(row.count), 0),
    activeMembers,
    activeCourseMembers,
    engagementRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
    courseEnrollments,
    courseCompletions,
    lessonViews,
    quizStarts,
    quizAttempts,
    averageQuizScore,
    mockTestAttempts,
    readinessChecks,
    seminarRegistrations,
    orders,
    completedOrders,
    revenue,
  };

  const { keys, labels } = daySeries(start, end);
  const signupByKey = new Map(
    signupRows.map((row: { _id: string; count: number }) => [row._id, number(row.count)]),
  );
  const orderByKey = new Map(
    orderTrendRows.map((row: { _id: string; count: number; revenue: number }) => [
      row._id,
      { count: number(row.count), revenue: number(row.revenue) },
    ]),
  );

  const recentOrders: OverviewRecentOrder[] = recentOrderRows.map((order) => {
    const populated = order as unknown as { user?: { name?: string; email?: string } };
    return {
      id: order._id.toString(),
      userName: populated.user?.name ?? "",
      userEmail: populated.user?.email ?? order.email ?? "",
      itemTitle: order.items[0]?.title ?? "Order",
      total: order.total,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    };
  });

  return {
    period: range.period,
    currency,
    range: { from: range.from, to: range.to, days: range.days, label: range.label },
    metrics,
    growth: {
      labels,
      signups: keys.map((key) => signupByKey.get(key) ?? 0),
    },
    orderTrend: {
      labels,
      counts: keys.map((key) => orderByKey.get(key)?.count ?? 0),
      revenues: keys.map((key) => orderByKey.get(key)?.revenue ?? 0),
    },
    orderStatuses: statusRows.map((row: { _id: string; count: number }) => ({
      status: row._id,
      count: number(row.count),
    })),
    topItems: mapItems(topItemRows),
    recentOrders,
  };
}

async function resolveCourseTitles(
  slugs: string[],
  entries: {
    key: string;
    courseSlug: string;
    moduleIndex: number;
    lessonIndex: number;
  }[],
) {
  const unique = [...new Set(slugs.filter(Boolean))];
  const courses =
    unique.length > 0
      ? await Course.find({ slug: { $in: unique } })
          .select("slug title modules")
          .lean()
      : [];
  const bySlug = new Map(courses.map((course) => [course.slug, course]));

  return entries.map((entry) => {
    const course = bySlug.get(entry.courseSlug);
    const mod = course?.modules?.[entry.moduleIndex];
    const lesson = mod?.lessons?.[entry.lessonIndex];
    return {
      ...entry,
      courseTitle: course?.title ?? entry.courseSlug,
      moduleTitle: mod?.title ?? `Module ${entry.moduleIndex + 1}`,
      lessonTitle: lesson?.title ?? `Lesson ${entry.lessonIndex + 1}`,
    };
  });
}

export async function getUsageAnalytics(
  selection: DashboardRangeSelection,
  currency: SupportedCurrency,
): Promise<AdminUsageAnalytics> {
  await connectDb();
  const base = await getOverviewAnalytics(selection, currency);
  const range = resolveDashboardRange(selection);
  const { start, end } = range;

  const [trendRows, pageRows, lessonRows, quizRows] = await Promise.all([
    UsageEvent.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $project: { createdAt: 1, user: 1, event: 1 } },
      {
        $unionWith: {
          coll: QuizAttempt.collection.name,
          pipeline: [
            { $match: { createdAt: { $gte: start, $lt: end } } },
            { $project: { createdAt: 1, user: 1, event: { $literal: "quiz_attempt" } } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: MARKETING_REPORT_TIME_ZONE,
            },
          },
          pageViews: { $sum: { $cond: [{ $eq: ["$event", "page_view"] }, 1, 0] } },
          lessonViews: { $sum: { $cond: [{ $eq: ["$event", "lesson_view"] }, 1, 0] } },
          quizStarts: { $sum: { $cond: [{ $eq: ["$event", "quiz_start"] }, 1, 0] } },
          quizAttempts: { $sum: { $cond: [{ $eq: ["$event", "quiz_attempt"] }, 1, 0] } },
          users: { $addToSet: "$user" },
        },
      },
    ]),
    UsageEvent.aggregate([
      { $match: { event: "page_view", createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: "$path",
          views: { $sum: 1 },
          members: { $addToSet: "$user" },
        },
      },
      { $project: { path: "$_id", views: 1, members: { $size: "$members" } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
    UsageEvent.aggregate([
      {
        $match: {
          event: "lesson_view",
          courseSlug: { $exists: true, $ne: "" },
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: {
            courseSlug: "$courseSlug",
            moduleIndex: "$moduleIndex",
            lessonIndex: "$lessonIndex",
          },
          views: { $sum: 1 },
          members: { $addToSet: "$user" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
    QuizAttempt.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            courseSlug: "$courseSlug",
            moduleIndex: "$moduleIndex",
            lessonIndex: "$lessonIndex",
          },
          attempts: { $sum: 1 },
          members: { $addToSet: "$user" },
          averageScore: { $avg: "$score" },
        },
      },
      { $sort: { attempts: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const { keys, labels } = daySeries(start, end);
  const trendByKey = new Map(
    trendRows.map(
      (row: {
        _id: string;
        pageViews: number;
        lessonViews: number;
        quizStarts: number;
        quizAttempts: number;
        users: unknown[];
      }) => [row._id, row],
    ),
  );

  const lessonEntries = lessonRows.map(
    (row: { _id: { courseSlug: string; moduleIndex: number; lessonIndex: number } }) => ({
      key: `${row._id.courseSlug}:${row._id.moduleIndex}:${row._id.lessonIndex}`,
      courseSlug: row._id.courseSlug,
      moduleIndex: row._id.moduleIndex,
      lessonIndex: row._id.lessonIndex,
    }),
  );
  const quizEntries = quizRows.map(
    (row: { _id: { courseSlug: string; moduleIndex: number; lessonIndex: number } }) => ({
      key: `${row._id.courseSlug}:${row._id.moduleIndex}:${row._id.lessonIndex}`,
      courseSlug: row._id.courseSlug,
      moduleIndex: row._id.moduleIndex,
      lessonIndex: row._id.lessonIndex,
    }),
  );

  const [lessonTitles, quizTitles] = await Promise.all([
    resolveCourseTitles(
      lessonEntries.map((entry) => entry.courseSlug),
      lessonEntries,
    ),
    resolveCourseTitles(
      quizEntries.map((entry) => entry.courseSlug),
      quizEntries,
    ),
  ]);
  const lessonTitleByKey = new Map(lessonTitles.map((entry) => [entry.key, entry]));
  const quizTitleByKey = new Map(quizTitles.map((entry) => [entry.key, entry]));

  const topPages: UsageRankedPage[] = pageRows.map(
    (row: { path: string; views: number; members: number }) => ({
      path: row.path,
      views: number(row.views),
      members: number(row.members),
    }),
  );

  const topLessons: UsageRankedLesson[] = lessonRows.map(
    (row: {
      _id: { courseSlug: string; moduleIndex: number; lessonIndex: number };
      views: number;
      members: unknown[];
    }) => {
      const key = `${row._id.courseSlug}:${row._id.moduleIndex}:${row._id.lessonIndex}`;
      const title = lessonTitleByKey.get(key);
      return {
        courseSlug: row._id.courseSlug,
        courseTitle: title?.courseTitle ?? row._id.courseSlug,
        moduleTitle: title?.moduleTitle ?? `Module ${row._id.moduleIndex + 1}`,
        lessonTitle: title?.lessonTitle ?? `Lesson ${row._id.lessonIndex + 1}`,
        moduleIndex: row._id.moduleIndex,
        lessonIndex: row._id.lessonIndex,
        views: number(row.views),
        members: row.members.length,
      };
    },
  );

  const topQuizzes: UsageRankedQuiz[] = quizRows.map(
    (row: {
      _id: { courseSlug: string; moduleIndex: number; lessonIndex: number };
      attempts: number;
      members: unknown[];
      averageScore: number;
    }) => {
      const key = `${row._id.courseSlug}:${row._id.moduleIndex}:${row._id.lessonIndex}`;
      const title = quizTitleByKey.get(key);
      return {
        courseSlug: row._id.courseSlug,
        courseTitle: title?.courseTitle ?? row._id.courseSlug,
        moduleTitle: title?.moduleTitle ?? `Module ${row._id.moduleIndex + 1}`,
        lessonTitle: title?.lessonTitle ?? `Lesson ${row._id.lessonIndex + 1}`,
        moduleIndex: row._id.moduleIndex,
        lessonIndex: row._id.lessonIndex,
        attempts: number(row.attempts),
        members: row.members.length,
        averageScore: Math.round(number(row.averageScore)),
      };
    },
  );

  return {
    ...base,
    usageTrend: {
      labels,
      pageViews: keys.map((key) => number(trendByKey.get(key)?.pageViews)),
      lessonViews: keys.map((key) => number(trendByKey.get(key)?.lessonViews)),
      quizStarts: keys.map((key) => number(trendByKey.get(key)?.quizStarts)),
      quizAttempts: keys.map((key) => number(trendByKey.get(key)?.quizAttempts)),
      activeMembers: keys.map((key) => trendByKey.get(key)?.users.length ?? 0),
    },
    topPages,
    topLessons,
    topQuizzes,
  };
}
