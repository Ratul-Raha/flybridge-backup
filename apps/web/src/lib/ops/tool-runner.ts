import "server-only";

import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Course } from "@/lib/models/course";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { Order } from "@/lib/models/order";
import { Scholarship } from "@/lib/models/scholarship";
import { Automation } from "@/lib/models/automation";
import { AutomationRun } from "@/lib/models/automation-run";
import { EventLog } from "@/lib/models/event-log";
import { Notification } from "@/lib/models/notification";
import { PushSubscription } from "@/lib/models/push-subscription";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { CourseProgress } from "@/lib/models/course-progress";
import { ResourceDownload } from "@/lib/models/resource-download";
import { crawlUrl, crawlUrlForScholarship } from "@/lib/ops/crawler";
import { pushToUsers } from "@/lib/push";

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationPreview?: {
    title: string;
    description: string;
    details: Record<string, unknown>;
  };
};

export type ToolContext = {
  userId: string;
  userName: string;
};

async function findUser(identifier: string) {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { name: { $regex: identifier, $options: "i" } },
      { _id: identifier.match(/^[0-9a-f]{24}$/i) ? identifier : null },
    ],
  }).lean();
  return user;
}

export async function executeTool(
  toolId: string,
  params: Record<string, unknown>,
  ctx: ToolContext,
  confirmed = false,
): Promise<ToolResult> {
  await connectDb();
  const start = Date.now();

  try {
    let result: ToolResult;

    switch (toolId) {
      case "get_dashboard_summary":
        result = await getDashboardSummary();
        break;
      case "search_users":
        result = await searchUsers(params);
        break;
      case "get_user_detail":
        result = await getUserDetail(params);
        break;
      case "get_orders":
        result = await getOrders(params);
        break;
      case "get_revenue_report":
        result = await getRevenueReport(params);
        break;
      case "get_seminars":
        result = await getSeminars(params);
        break;
      case "get_courses":
        result = await getCourses(params);
        break;
      case "get_scholarships":
        result = await getScholarships(params);
        break;
      case "get_automations":
        result = await getAutomations();
        break;
      case "get_event_log":
        result = await getEventLog(params);
        break;
      case "get_readiness_stats":
        result = await getReadinessStats(params);
        break;
      case "create_seminar":
        result = await createSeminar(params, confirmed);
        break;
      case "crawl_and_create_seminar":
        result = await crawlAndCreateSeminar(params, confirmed);
        break;
      case "update_seminar":
        result = await updateSeminar(params, confirmed);
        break;
      case "update_user":
        result = await updateUser(params, confirmed);
        break;
      case "send_notification":
        result = await sendNotification(params, confirmed);
        break;
      case "toggle_automation":
        result = await toggleAutomation(params, confirmed);
        break;
      case "emit_event":
        result = await emitEvent(params, confirmed);
        break;
      case "update_course":
        result = await updateCourse(params, confirmed);
        break;
      case "create_scholarship":
        result = await createScholarship(params, confirmed);
        break;
      case "crawl_and_create_scholarship":
        result = await crawlAndCreateScholarship(params, confirmed);
        break;
      case "delete_user":
        result = await deleteUser(params, confirmed);
        break;
      default:
        result = { success: false, error: `Unknown tool: ${toolId}` };
    }

    const durationMs = Date.now() - start;
    if (durationMs > 5000) {
      console.warn(`[ops-bot] Slow tool ${toolId}: ${durationMs}ms`);
    }

    return result;
  } catch (error) {
    console.error(`[ops-bot] Tool ${toolId} error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
  }
}

// ─── Read-only tools ───────────────────────────────────────────────

async function getDashboardSummary(): Promise<ToolResult> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalUsers,
    newThisWeek,
    newThisMonth,
    paidUsers,
    totalOrders,
    completedOrders,
    pendingOrders,
    failedOrders,
    revenueAgg,
    totalCourses,
    publishedCourses,
    totalSeminars,
    upcomingSeminars,
    totalEnrollments,
    totalReadiness,
    activeAutomations,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.countDocuments({ createdAt: { $gte: monthAgo } }),
    User.countDocuments({ subscription: "paid" }),
    Order.countDocuments(),
    Order.countDocuments({ status: "completed" }),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "failed" }),
    Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$total" }, avg: { $avg: "$total" } } },
    ]),
    Course.countDocuments(),
    Course.countDocuments({ published: true }),
    Seminar.countDocuments(),
    Seminar.countDocuments({ dateTime: { $gte: new Date() } }),
    CourseEnrollment.countDocuments(),
    ReadinessRun.countDocuments(),
    Automation.countDocuments({ active: true }),
  ]);

  const revenue = revenueAgg[0] ?? { total: 0, avg: 0 };

  return {
    success: true,
    data: {
      users: {
        total: totalUsers,
        paid: paidUsers,
        free: totalUsers - paidUsers,
        newThisWeek,
        newThisMonth,
      },
      revenue: {
        total: revenue.total,
        average: Math.round(revenue.avg * 100) / 100,
        currency: "USD",
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        failed: failedOrders,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        enrollments: totalEnrollments,
      },
      seminars: {
        total: totalSeminars,
        upcoming: upcomingSeminars,
      },
      readiness: {
        totalChecks: totalReadiness,
      },
      automations: {
        active: activeAutomations,
      },
    },
  };
}

async function searchUsers(params: Record<string, unknown>): Promise<ToolResult> {
  const query = (params.query as string) ?? "";
  const accountType = params.accountType as string | undefined;
  const subscription = params.subscription as string | undefined;
  const sortBy = (params.sortBy as string) ?? "newest";
  const limit = Math.min(50, Math.max(1, (params.limit as number) ?? 10));

  const filter: Record<string, unknown> = {};
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ];
  }
  if (accountType) filter.accountType = accountType;
  if (subscription) filter.subscription = subscription;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name: { name: 1 },
  };

  const users = await User.find(filter)
    .sort(sortMap[sortBy] ?? sortMap.newest)
    .limit(limit)
    .lean();

  const userIds = users.map((u) => u._id);
  const [enrollCounts, regCounts] = await Promise.all([
    CourseEnrollment.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]),
    SeminarRegistration.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]),
  ]);

  const enrollMap = new Map(enrollCounts.map((r) => [r._id.toString(), r.count]));
  const regMap = new Map(regCounts.map((r) => [r._id.toString(), r.count]));

  return {
    success: true,
    data: {
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        accountType: u.accountType,
        subscription: u.subscription,
        enrollments: enrollMap.get(u._id.toString()) ?? 0,
        seminars: regMap.get(u._id.toString()) ?? 0,
        createdAt: u.createdAt,
      })),
      total: users.length,
    },
  };
}

async function getUserDetail(params: Record<string, unknown>): Promise<ToolResult> {
  const identifier = params.identifier as string;
  if (!identifier) return { success: false, error: "identifier is required" };

  const user = await findUser(identifier);
  if (!user) return { success: false, error: `User not found: ${identifier}` };

  const [enrollments, seminarRegs, downloads, readinessRuns, certProgress] = await Promise.all([
    CourseEnrollment.find({ user: user._id }).populate("course", "title slug").lean(),
    SeminarRegistration.find({ user: user._id }).populate("seminar", "title dateTime").lean(),
    ResourceDownload.find({ user: user._id }).countDocuments(),
    ReadinessRun.find({ user: user._id }).sort({ createdAt: -1 }).limit(3).lean(),
    CourseProgress.find({ user: user._id }).lean(),
  ]);

  const certificates = certProgress.filter((p) => p.certificateIssued).length;
  const certDownloaded = certProgress.filter((p) => (p.certificateDownloadCount ?? 0) > 0).length;

  return {
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        accountType: user.accountType,
        subscription: user.subscription,
        createdAt: user.createdAt,
      },
      enrollments: enrollments.map((e) => ({
        course: (e.course as { title?: string; slug?: string } | null)?.title ?? "Unknown",
        status: e.status,
        enrolledAt: e.createdAt,
      })),
      seminarRegistrations: seminarRegs.map((r) => ({
        seminar: (r.seminar as { title?: string; dateTime?: Date } | null)?.title ?? "Unknown",
        date: (r.seminar as { dateTime?: Date } | null)?.dateTime,
      })),
      downloads,
      readinessRuns: readinessRuns.map((r) => ({
        score: r.score,
        label: r.label,
        date: r.createdAt,
      })),
      certificates: {
        total: certificates,
        downloaded: certDownloaded,
      },
    },
  };
}

async function getOrders(params: Record<string, unknown>): Promise<ToolResult> {
  const status = params.status as string | undefined;
  const days = (params.days as number) ?? 30;
  const limit = Math.min(50, Math.max(1, (params.limit as number) ?? 10));

  const since = new Date(Date.now() - days * 86_400_000);
  const filter: Record<string, unknown> = { createdAt: { $gte: since } };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).limit(limit).populate("user", "name email").lean(),
    Order.countDocuments(filter),
  ]);

  return {
    success: true,
    data: {
      orders: orders.map((o) => ({
        id: o._id.toString(),
        user: (o.user as { name?: string; email?: string } | null)?.name ?? "Unknown",
        email: o.email,
        items: o.items.map((i) => ({ title: i.title, price: i.price, type: i.itemType })),
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
      total,
      period: `Last ${days} days`,
    },
  };
}

async function getRevenueReport(params: Record<string, unknown>): Promise<ToolResult> {
  const days = (params.days as number) ?? 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const [revenueAgg, topItems, statusBreakdown] = await Promise.all([
    Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 },
          avg: { $avg: "$total" },
        },
      },
    ]),
    Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: since } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { title: "$items.title", type: "$items.itemType" },
          revenue: { $sum: "$items.price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
    ]),
  ]);

  const rev = revenueAgg[0] ?? { total: 0, count: 0, avg: 0 };

  return {
    success: true,
    data: {
      period: `Last ${days} days`,
      totalRevenue: rev.total,
      totalOrders: rev.count,
      averageOrderValue: Math.round(rev.avg * 100) / 100,
      topItems: topItems.map((i) => ({
        name: i._id.title,
        type: i._id.type,
        revenue: i.revenue,
        orders: i.count,
      })),
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s._id,
        count: s.count,
        total: s.total,
      })),
    },
  };
}

async function getSeminars(params: Record<string, unknown>): Promise<ToolResult> {
  const upcoming = params.upcoming !== "false";
  const limit = Math.min(50, Math.max(1, (params.limit as number) ?? 10));

  const filter: Record<string, unknown> = {};
  if (upcoming) filter.dateTime = { $gte: new Date() };
  else filter.dateTime = { $lt: new Date() };

  const seminars = await Seminar.find(filter)
    .sort({ dateTime: upcoming ? 1 : -1 })
    .limit(limit)
    .lean();

  const seminarIds = seminars.map((s) => s._id);
  const regCounts = await SeminarRegistration.aggregate([
    { $match: { seminar: { $in: seminarIds } } },
    { $group: { _id: "$seminar", count: { $sum: 1 } } },
  ]);
  const regMap = new Map(regCounts.map((r) => [r._id.toString(), r.count]));

  return {
    success: true,
    data: {
      seminars: seminars.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        dateTime: s.dateTime,
        type: s.type,
        price: s.price,
        duration: s.duration,
        registrations: regMap.get(s._id.toString()) ?? 0,
      })),
      total: seminars.length,
    },
  };
}

async function getCourses(params: Record<string, unknown>): Promise<ToolResult> {
  const sortBy = (params.sortBy as string) ?? "popular";
  const limit = Math.min(50, Math.max(1, (params.limit as number) ?? 10));

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    popular: { createdAt: -1 },
    newest: { createdAt: -1 },
    rating: { averageRating: -1 },
  };

  const courses = await Course.find({ published: true })
    .sort(sortMap[sortBy] ?? sortMap.popular)
    .limit(limit)
    .lean();

  const courseIds = courses.map((c) => c._id);
  const enrollCounts = await CourseEnrollment.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: "$course", count: { $sum: 1 } } },
  ]);
  const enrollMap = new Map(enrollCounts.map((r) => [r._id.toString(), r.count]));

  return {
    success: true,
    data: {
      courses: courses.map((c) => ({
        id: c._id.toString(),
        slug: c.slug,
        title: c.title,
        price: c.price,
        featured: c.featured,
        averageRating: c.averageRating ?? null,
        reviewCount: c.reviewCount ?? 0,
        enrollments: enrollMap.get(c._id.toString()) ?? 0,
      })),
      total: courses.length,
    },
  };
}

async function getScholarships(params: Record<string, unknown>): Promise<ToolResult> {
  const country = params.country as string | undefined;
  const activeOnly = params.activeOnly !== "false";
  const limit = Math.min(50, Math.max(1, (params.limit as number) ?? 10));

  const filter: Record<string, unknown> = {};
  if (activeOnly) filter.active = true;
  if (country) filter.country = { $regex: country, $options: "i" };

  const scholarships = await Scholarship.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  return {
    success: true,
    data: {
      scholarships: scholarships.map((s) => ({
        id: s._id.toString(),
        institution: s.institution,
        title: s.title,
        country: s.country,
        amount: s.amount,
        deadline: s.deadline,
        level: s.level,
        active: s.active,
      })),
      total: scholarships.length,
    },
  };
}

async function getAutomations(): Promise<ToolResult> {
  const [automations, recentRuns] = await Promise.all([
    Automation.find().sort({ createdAt: -1 }).lean(),
    AutomationRun.find().sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return {
    success: true,
    data: {
      automations: automations.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        active: a.active,
        description: a.description,
        createdAt: a.createdAt,
      })),
      recentRuns: recentRuns.map((r) => ({
        automation: r.automationName,
        eventName: r.eventName,
        status: r.status,
        startedAt: r.startedAt,
      })),
    },
  };
}

async function getEventLog(params: Record<string, unknown>): Promise<ToolResult> {
  const limit = Math.min(200, Math.max(1, (params.limit as number) ?? 20));

  const events = await EventLog.find().sort({ createdAt: -1 }).limit(limit).lean();

  return {
    success: true,
    data: {
      events: events.map((e) => ({
        id: e._id.toString(),
        name: e.name,
        status: e.status,
        handlers: e.handlers?.length ?? 0,
        automationsRun: e.automationsRun ?? 0,
        createdAt: e.createdAt,
      })),
      total: events.length,
    },
  };
}

async function getReadinessStats(params: Record<string, unknown>): Promise<ToolResult> {
  const days = (params.days as number) ?? 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const [stats, totalRuns, scoreDistribution] = await Promise.all([
    ReadinessRun.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          totalRuns: { $sum: 1 },
          avgScore: { $avg: "$score" },
          minScore: { $min: "$score" },
          maxScore: { $max: "$score" },
        },
      },
    ]),
    ReadinessRun.countDocuments({ createdAt: { $gte: since } }),
    ReadinessRun.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $bucket: {
          groupBy: "$score",
          boundaries: [0, 25, 50, 75, 100],
          default: "100",
          output: { count: { $sum: 1 } },
        },
      },
    ]),
  ]);

  const s = stats[0] ?? { totalRuns: 0, avgScore: 0, minScore: 0, maxScore: 0 };

  return {
    success: true,
    data: {
      period: `Last ${days} days`,
      totalRuns,
      averageScore: Math.round(s.avgScore ?? 0),
      minScore: s.minScore ?? 0,
      maxScore: s.maxScore ?? 0,
      distribution: scoreDistribution.map((d) => ({
        range: `${d._id}-${d._id + 24}`,
        count: d.count,
      })),
    },
  };
}

// ─── Write tools ───────────────────────────────────────────────────

async function createSeminar(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const title = params.title as string;
  const dateTime = params.dateTime as string;
  if (!title || !dateTime) return { success: false, error: "title and dateTime are required" };

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Create Seminar",
        description: `Create a new seminar "${title}"`,
        details: {
          title,
          dateTime,
          type: (params.type as string) ?? "free",
          price: (params.price as number) ?? 0,
          duration: (params.duration as string) ?? "60 min",
          url: (params.url as string) ?? "",
        },
      },
    };
  }

  const seminar = await Seminar.create({
    title,
    description: (params.description as string) ?? "",
    dateTime: new Date(dateTime),
    type: (params.type as "free" | "paid") ?? "free",
    price: (params.price as number) ?? 0,
    duration: (params.duration as string) ?? "60 min",
    url: (params.url as string) ?? "",
  });

  return {
    success: true,
    data: {
      message: `Seminar "${title}" created successfully`,
      seminarId: seminar._id.toString(),
    },
  };
}

async function crawlAndCreateSeminar(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const url = params.url as string;
  if (!url) return { success: false, error: "url is required" };

  let crawled;
  try {
    crawled = await crawlUrl(url);
  } catch (e) {
    return {
      success: false,
      error: `Failed to crawl URL: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }

  const title = (params.title as string) || crawled.title;
  const dateTime = (params.dateTime as string) || crawled.dateTime;
  if (!title)
    return {
      success: false,
      error: "Could not extract a title from the page. Please provide one.",
    };
  if (!dateTime)
    return {
      success: false,
      error: "Could not extract a date/time from the page. Please provide one.",
    };

  const d = new Date(dateTime);
  if (isNaN(d.getTime())) return { success: false, error: `Invalid date/time: ${dateTime}` };

  const type = (params.type as "free" | "paid") || crawled.type || "free";
  const price = (params.price as number) ?? crawled.price ?? 0;
  const duration = (params.duration as string) || crawled.duration || "60 min";
  const description = (params.description as string) || crawled.description || "";
  const image = crawled.image || "";

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Crawl & Create Seminar",
        description: `Crawled ${url} — create seminar "${title}"`,
        details: {
          title,
          dateTime: d.toISOString(),
          description: description.slice(0, 300) || "(none)",
          type,
          price,
          duration,
          image: image || "(none)",
          crawledFrom: url,
        },
      },
    };
  }

  const seminar = await Seminar.create({
    title,
    description,
    dateTime: d,
    type,
    price: type === "paid" ? price : 0,
    duration,
    image,
    url,
  });

  return {
    success: true,
    data: {
      message: `Seminar "${title}" created from ${url}`,
      seminarId: seminar._id.toString(),
    },
  };
}

async function updateSeminar(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const seminarId = params.seminarId as string;
  if (!seminarId) return { success: false, error: "seminarId is required" };

  const seminar = await Seminar.findOne({
    $or: [
      { _id: seminarId.match(/^[0-9a-f]{24}$/i) ? seminarId : null },
      { title: { $regex: seminarId, $options: "i" } },
    ],
  }).lean();

  if (!seminar) return { success: false, error: `Seminar not found: ${seminarId}` };

  const updates: Record<string, unknown> = {};
  if (params.title) updates.title = params.title;
  if (params.description) updates.description = params.description;
  if (params.dateTime) updates.dateTime = new Date(params.dateTime as string);
  if (params.type) updates.type = params.type;
  if (params.price !== undefined) updates.price = params.price;
  if (params.duration) updates.duration = params.duration;
  if (params.url) updates.url = params.url;

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Update Seminar",
        description: `Update seminar "${seminar.title}"`,
        details: { currentTitle: seminar.title, changes: updates },
      },
    };
  }

  await Seminar.updateOne({ _id: seminar._id }, { $set: updates });

  return {
    success: true,
    data: { message: `Seminar "${seminar.title}" updated successfully` },
  };
}

async function updateUser(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const identifier = params.identifier as string;
  if (!identifier) return { success: false, error: "identifier is required" };

  const user = await findUser(identifier);
  if (!user) return { success: false, error: `User not found: ${identifier}` };

  const updates: Record<string, unknown> = {};
  if (params.accountType) updates.accountType = params.accountType;
  if (params.subscription) updates.subscription = params.subscription;

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "No updates specified" };
  }

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Update User",
        description: `Update user "${user.name}" (${user.email})`,
        details: {
          currentRole: user.accountType,
          currentSubscription: user.subscription,
          changes: updates,
        },
      },
    };
  }

  await User.updateOne({ _id: user._id }, { $set: updates });

  return {
    success: true,
    data: { message: `User "${user.name}" updated successfully` },
  };
}

async function sendNotification(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const recipientType = params.recipientType as string;
  const title = params.title as string;
  const message = params.message as string;
  if (!recipientType || !title || !message) {
    return { success: false, error: "recipientType, title, and message are required" };
  }

  const recipientFilter: Record<string, unknown> = {};
  if (recipientType === "paid") recipientFilter.subscription = "paid";
  else if (recipientType === "free") recipientFilter.subscription = "free";
  else if (recipientType === "admins") recipientFilter.accountType = "admin";
  else if (recipientType === "moderators") recipientFilter.accountType = "moderator";

  const recipientCount = await User.countDocuments(recipientFilter);

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Send Notification",
        description: `Send "${title}" to ${recipientCount} users (${recipientType})`,
        details: { recipientType, recipientCount, title, message },
      },
    };
  }

  const users = await User.find(recipientFilter, { _id: 1 }).lean();
  const notifications = users.map((u) => ({
    recipient: u._id,
    type: "automation" as const,
    title,
    message,
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
    void pushToUsers(
      users.map((u) => u._id),
      { title, body: message, url: "/dashboard/notifications" },
      { urgency: "high" },
    ).catch((error) => {
      console.error("[push] failed to send admin broadcast:", error);
    });
  }

  return {
    success: true,
    data: { message: `Notification sent to ${notifications.length} users` },
  };
}

async function toggleAutomation(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const automationId = params.automationId as string;
  const active = params.active === "true";
  if (!automationId) return { success: false, error: "automationId is required" };

  const automation = await Automation.findOne({
    $or: [
      { _id: automationId.match(/^[0-9a-f]{24}$/i) ? automationId : null },
      { name: { $regex: automationId, $options: "i" } },
    ],
  }).lean();

  if (!automation) return { success: false, error: `Automation not found: ${automationId}` };

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: active ? "Enable Automation" : "Disable Automation",
        description: `${active ? "Enable" : "Disable"} automation "${automation.name}"`,
        details: { name: automation.name, currentlyActive: automation.active, newActive: active },
      },
    };
  }

  await Automation.updateOne({ _id: automation._id }, { $set: { active } });

  return {
    success: true,
    data: { message: `Automation "${automation.name}" ${active ? "enabled" : "disabled"}` },
  };
}

async function emitEvent(params: Record<string, unknown>, confirmed: boolean): Promise<ToolResult> {
  const eventName = params.eventName as string;
  if (!eventName) return { success: false, error: "eventName is required" };

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Emit Event",
        description: `Manually trigger event "${eventName}"`,
        details: {
          eventName,
          note: "This will trigger all registered handlers and matching automations",
        },
      },
    };
  }

  const { emitEvent: emit } = await import("@/lib/events/emit");
  await emit(eventName as never, {});

  return {
    success: true,
    data: { message: `Event "${eventName}" emitted successfully` },
  };
}

async function updateCourse(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const courseSlug = params.courseSlug as string;
  if (!courseSlug) return { success: false, error: "courseSlug is required" };

  const course = await Course.findOne({
    $or: [{ slug: courseSlug }, { title: { $regex: courseSlug, $options: "i" } }],
  }).lean();

  if (!course) return { success: false, error: `Course not found: ${courseSlug}` };

  const updates: Record<string, unknown> = {};
  if (params.published) updates.published = params.published === "true";
  if (params.featured) updates.featured = params.featured === "true";
  if (params.upcoming) updates.upcoming = params.upcoming === "true";
  if (params.price !== undefined) updates.price = params.price;

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Update Course",
        description: `Update course "${course.title}"`,
        details: { currentTitle: course.title, changes: updates },
      },
    };
  }

  await Course.updateOne({ _id: course._id }, { $set: updates });

  return {
    success: true,
    data: { message: `Course "${course.title}" updated successfully` },
  };
}

async function createScholarship(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const institution = params.institution as string;
  const title = params.title as string;
  if (!institution || !title)
    return { success: false, error: "institution and title are required" };

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Create Scholarship",
        description: `Create scholarship "${title}" at ${institution}`,
        details: {
          institution,
          title,
          country: (params.country as string) ?? "",
          amount: (params.amount as string) ?? "",
          deadline: (params.deadline as string) ?? "",
        },
      },
    };
  }

  const scholarship = await Scholarship.create({
    institution,
    title,
    rawText: (params.description as string) ?? title,
    description: (params.description as string) ?? "",
    country: (params.country as string) ?? "",
    amount: (params.amount as string) ?? "",
    deadline: (params.deadline as string) ?? "",
    eligibility: (params.eligibility as string) ?? "",
    applyUrl: (params.applyUrl as string) ?? "",
    active: true,
  });

  return {
    success: true,
    data: { message: `Scholarship "${title}" created`, scholarshipId: scholarship._id.toString() },
  };
}

async function crawlAndCreateScholarship(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const url = params.url as string;
  if (!url) return { success: false, error: "url is required" };

  let crawled;
  try {
    crawled = await crawlUrlForScholarship(url);
  } catch (e) {
    return {
      success: false,
      error: `Failed to crawl URL: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }

  const title = (params.title as string) || crawled.title;
  const institution = (params.institution as string) || crawled.institution;
  if (!title)
    return {
      success: false,
      error: "Could not extract a title from the page. Please provide one.",
    };
  if (!institution)
    return {
      success: false,
      error: "Could not extract an institution from the page. Please provide one.",
    };

  const country = (params.country as string) || crawled.country || "";
  const amount = (params.amount as string) || crawled.amount || "";
  const deadline = (params.deadline as string) || crawled.deadline || "";
  const eligibility = (params.eligibility as string) || crawled.eligibility || "";
  const description = (params.description as string) || crawled.description || "";
  const applyUrl = (params.applyUrl as string) || crawled.applyUrl || url;

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "Crawl & Create Scholarship",
        description: `Crawled ${url} — create scholarship "${title}" at ${institution}`,
        details: {
          institution,
          title,
          country: country || "(none)",
          amount: amount || "(none)",
          deadline: deadline || "(none)",
          eligibility: eligibility?.slice(0, 200) || "(none)",
          description: description?.slice(0, 300) || "(none)",
          crawledFrom: url,
        },
      },
    };
  }

  const scholarship = await Scholarship.create({
    institution,
    title,
    rawText: description || title,
    description,
    country,
    amount,
    deadline,
    eligibility,
    applyUrl,
    active: true,
  });

  return {
    success: true,
    data: {
      message: `Scholarship "${title}" created from ${url}`,
      scholarshipId: scholarship._id.toString(),
    },
  };
}

async function deleteUser(
  params: Record<string, unknown>,
  confirmed: boolean,
): Promise<ToolResult> {
  const identifier = params.identifier as string;
  if (!identifier) return { success: false, error: "identifier is required" };

  const user = await findUser(identifier);
  if (!user) return { success: false, error: `User not found: ${identifier}` };

  if (!confirmed) {
    return {
      success: true,
      requiresConfirmation: true,
      confirmationPreview: {
        title: "DELETE USER (Destructive)",
        description: `Permanently delete user "${user.name}" (${user.email}) and ALL their data. This CANNOT be undone.`,
        details: {
          name: user.name,
          email: user.email,
          role: user.accountType,
          subscription: user.subscription,
          warning:
            "This will also delete: enrollments, seminar registrations, resource downloads, readiness runs, course progress, notifications, push subscriptions",
        },
      },
    };
  }

  const { default: mongoose } = await import("mongoose");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = user._id;
    await Promise.all([
      CourseEnrollment.deleteMany({ user: userId }).session(session),
      SeminarRegistration.deleteMany({ user: userId }).session(session),
      ResourceDownload.deleteMany({ user: userId }).session(session),
      ReadinessRun.deleteMany({ user: userId }).session(session),
      CourseProgress.deleteMany({ user: userId }).session(session),
      Notification.deleteMany({ recipient: userId }).session(session),
      PushSubscription.deleteMany({ user: userId }).session(session),
      User.deleteOne({ _id: userId }).session(session),
    ]);

    await session.commitTransaction();
    return {
      success: true,
      data: { message: `User "${user.name}" (${user.email}) permanently deleted` },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
