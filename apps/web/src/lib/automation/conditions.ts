import "server-only";

import { connectDb } from "@/lib/db";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { ResourceDownload } from "@/lib/models/resource-download";
import { Course } from "@/lib/models/course";
import type { ConditionOperator } from "./types";

export function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".").filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** DB-backed evaluations. These are only available for "has_…" style
 *  operators which inspect a user's real activity instead of the payload. */
async function evaluateEntityOperator(
  operator: ConditionOperator,
  userId: string | undefined,
  expected: string | undefined,
): Promise<boolean> {
  if (!userId) return false;
  await connectDb();

  switch (operator) {
    case "has_enrolled": {
      const query: Record<string, unknown> = { user: userId as never, status: "active" };
      if (expected && expected.trim()) {
        const course = await Course.findOne({ slug: expected.trim() }).select("_id").lean();
        if (!course) return false;
        query.course = course._id;
      }
      return !!(await CourseEnrollment.exists(query));
    }
    case "has_resource_download":
      return !!(await ResourceDownload.exists({ user: userId as never }));
    case "has_readiness_run":
      return !!(await ReadinessRun.exists({ user: userId as never }));
    case "has_certificate":
      return !!(await CourseProgress.exists({ user: userId as never, certificateIssued: true }));
    case "progress_gte":
    case "progress_lt": {
      const threshold = Number(expected);
      if (Number.isNaN(threshold)) return false;
      const comp = operator === "progress_gte" ? { $gte: threshold } : { $lt: threshold };
      return !!(await CourseProgress.exists({
        user: userId as never,
        overallPercentage: comp,
      }));
    }
    default:
      return false;
  }
}

export async function evaluateCondition(
  field: string,
  operator: ConditionOperator | undefined,
  expected: string | undefined,
  payload: Record<string, unknown>
): Promise<boolean> {
  const op = operator ?? "equals";

  if (
    op === "has_enrolled" ||
    op === "has_resource_download" ||
    op === "has_readiness_run" ||
    op === "has_certificate" ||
    op === "progress_gte" ||
    op === "progress_lt"
  ) {
    const userId = resolvePath(payload, "user.id") as string | undefined;
    return evaluateEntityOperator(op, userId, expected);
  }

  const actual = resolvePath(payload, field);
  switch (op) {
    case "equals":
      return String(actual ?? "") === String(expected ?? "");
    case "not_equals":
      return String(actual ?? "") !== String(expected ?? "");
    case "contains":
      return String(actual ?? "").includes(String(expected ?? ""));
    case "not_contains":
      return !String(actual ?? "").includes(String(expected ?? ""));
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "not_exists":
      return actual === undefined || actual === null || actual === "";
    case "gt": {
      const a = Number(actual);
      const b = Number(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a > b;
    }
    case "lt": {
      const a = Number(actual);
      const b = Number(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a < b;
    }
    default:
      return false;
  }
}