import "server-only";

import { randomUUID } from "crypto";
import { connectDb } from "@/lib/db";
import { Session } from "@/lib/models/session";

export const MAX_SESSIONS = 2;
/** A session is "active" for this long since its last activity. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Touch lastSeenAt at most once per interval to avoid a write per request. */
const TOUCH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function newSessionId(): string {
  return randomUUID();
}

/** Best-effort human-readable device name from a User-Agent string. */
export function describeDevice(userAgent?: string | null): string {
  const ua = userAgent ?? "";
  const lower = ua.toLowerCase();

  let browser = "Browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\//i.test(ua)) browser = "Opera";
  else if (/chrome\//i.test(ua)) browser = "Chrome";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/safari\//i.test(ua)) browser = "Safari";

  let os = "Device";
  if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("iphone")) os = "iPhone";
  else if (lower.includes("ipad")) os = "iPad";
  else if (lower.includes("mac")) os = "macOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("linux")) os = "Linux";

  return `${browser} on ${os}`;
}

const cutoff = () => new Date(Date.now() - SESSION_TTL_MS);

/**
 * Registers a new login session. Expired sessions are cleaned up, and if the
 * account already has MAX_SESSIONS active sessions the oldest one(s) are
 * evicted so the newest login always wins (at most MAX_SESSIONS stay active).
 */
export async function registerSession(
  userId: string,
  sessionId: string,
  userAgent?: string | null
): Promise<void> {
  await connectDb();

  await Session.deleteMany({ user: userId, lastSeenAt: { $lt: cutoff() } });

  const active = await Session.find({ user: userId })
    .sort({ lastSeenAt: 1 })
    .select("_id")
    .lean();

  if (active.length >= MAX_SESSIONS) {
    const overflow = active.slice(0, active.length - (MAX_SESSIONS - 1));
    await Session.deleteMany({ _id: { $in: overflow.map((s) => s._id) } });
  }

  await Session.updateOne(
    { user: userId, sessionId },
    {
      $set: {
        deviceName: describeDevice(userAgent),
        userAgent: userAgent ?? "",
        lastSeenAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Returns true if the session is still active (exists and not expired), and
 * touches its lastSeenAt on an interval so long-lived sessions stay fresh.
 */
export async function verifySession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  await connectDb();
  const doc = await Session.findOne({ user: userId, sessionId })
    .select("lastSeenAt")
    .lean();
  if (!doc) return false;

  const seen = new Date(doc.lastSeenAt).getTime();
  if (seen < cutoff().getTime()) return false;

  if (Date.now() - seen > TOUCH_INTERVAL_MS) {
    Session.updateOne(
      { user: userId, sessionId },
      { $set: { lastSeenAt: new Date() } }
    ).catch((error) => console.error("session touch error", error));
  }
  return true;
}

export async function destroySessionRecord(
  userId: string,
  sessionId: string
): Promise<void> {
  await connectDb();
  await Session.deleteOne({ user: userId, sessionId });
}

export async function listSessions(userId: string) {
  await connectDb();
  const docs = await Session.find({ user: userId }).sort({ lastSeenAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    sessionId: d.sessionId,
    deviceName: d.deviceName ?? "Unknown device",
    lastSeenAt: new Date(d.lastSeenAt).toISOString(),
    createdAt: (d.createdAt as Date)?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function removeSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  await connectDb();
  const res = await Session.deleteOne({ user: userId, sessionId });
  return res.deletedCount > 0;
}
