import { CourseEnrollment } from "@/lib/models/enrollment";
import { SeminarRegistration } from "@/lib/models/seminar";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { CourseProgress } from "@/lib/models/course-progress";
import { ACCOUNT_TYPES, SUBSCRIPTION_TYPES } from "@/lib/roles";

export const USER_SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  "name-desc": { name: -1 },
};

export function userSortKey(sort: string | null): Record<string, 1 | -1> {
  return USER_SORT_MAP[sort ?? ""] ?? USER_SORT_MAP.newest;
}

/**
 * Builds the Mongo filter for the admin users list from the request query.
 * Shared by the list endpoint and "select all matching" resolution so both
 * always describe the exact same set of users.
 */
export async function buildUserFilter(searchParams: URLSearchParams): Promise<Record<string, unknown>> {
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const accountType = searchParams.get("accountType") ?? "";
  const subscription = searchParams.get("subscription") ?? "";
  const certDownloaded = searchParams.get("certificateDownloaded") ?? "";
  const course = searchParams.get("course") ?? "";
  const seminar = searchParams.get("seminar") ?? "";
  const resource = searchParams.get("resource") ?? "";
  const scoreMin = Number(searchParams.get("scoreMin"));

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

  // Engagement filters are computed as user-id sets, then intersected
  // ($in) / subtracted ($nin) against the rest of the User query.
  const include = new Set<string>();
  const exclude = new Set<string>();
  let haveInclude = false;
  const addInclude = (ids: string[]) => {
    if (ids.length === 0) {
      include.clear();
      haveInclude = true;
      return;
    }
    const set = new Set(ids);
    if (!haveInclude) {
      ids.forEach((id) => include.add(id));
      haveInclude = true;
    } else {
      for (const id of [...include]) {
        if (!set.has(id)) include.delete(id);
      }
    }
  };
  const addExclude = (ids: string[]) => ids.forEach((id) => exclude.add(id));

  if (course === "any" || course === "none") {
    const enrolled = (await CourseEnrollment.distinct("user").lean()).map(String);
    (course === "any" ? addInclude : addExclude)(enrolled);
  } else if (course) {
    const enrolled = (await CourseEnrollment.distinct("user", { course }).lean()).map(String);
    addInclude(enrolled);
  }

  if (seminar === "any" || seminar === "none") {
    const regs = (await SeminarRegistration.distinct("user").lean()).map(String);
    (seminar === "any" ? addInclude : addExclude)(regs);
  }

  if (resource === "any" || resource === "none") {
    const dls = (await ResourceDownload.distinct("user").lean()).map(String);
    (resource === "any" ? addInclude : addExclude)(dls);
  }

  if (Number.isFinite(scoreMin) && scoreMin > 0) {
    const scored = await ReadinessRun.aggregate<{ _id: unknown; score: number }>([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$user", score: { $first: "$score" } } },
      { $match: { score: { $gte: scoreMin } } },
    ]);
    addInclude(scored.map((r) => (r._id as { toString(): string }).toString()));
  }

  if (certDownloaded === "yes" || certDownloaded === "only") {
    const downloaded = await CourseProgress.find(
      { certificateDownloadCount: { $gt: 0 } },
      { user: 1 }
    ).lean();
    addInclude(downloaded.map((p) => p.user.toString()));
  }

  if (haveInclude) filter._id = { $in: [...include] };
  if (exclude.size > 0) {
    filter._id = { ...(filter._id ?? {}), $nin: [...exclude] };
  }

  return filter;
}
