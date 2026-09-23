import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { connectDb } from "@/lib/db";
import { Device } from "@/lib/models/device";

export const DEVICE_COOKIE = "flybridge_device";
export const MAX_DEVICES = 2;
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readDeviceId(): string | null {
  if (typeof window !== "undefined") return null;
  const store = cookies();
  return store.get(DEVICE_COOKIE)?.value ?? null;
}

export function newDeviceId(): string {
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

export async function registerDevice(
  userId: string,
  deviceId: string,
  deviceName: string,
  userAgent?: string | null
): Promise<{ allowed: boolean; registered: boolean }> {
  await connectDb();

  const exists = await Device.exists({ user: userId, deviceId });
  if (exists) return { allowed: true, registered: false };

  const count = await Device.countDocuments({ user: userId });
  if (count >= MAX_DEVICES) return { allowed: false, registered: false };

  await Device.create({
    user: userId,
    deviceId,
    deviceName,
    userAgent: userAgent ?? "",
    lastSeenAt: new Date(),
  });
  return { allowed: true, registered: true };
}

export async function touchDevice(
  userId: string,
  deviceId: string,
  deviceName: string,
  userAgent?: string | null
): Promise<void> {
  await connectDb();
  await Device.updateOne(
    { user: userId, deviceId },
    { $set: { lastSeenAt: new Date(), deviceName, userAgent: userAgent ?? "" } }
  );
}

export async function listDevices(userId: string): Promise<
  {
    id: string;
    deviceId: string;
    deviceName: string;
    lastSeenAt: string;
    createdAt: string;
  }[]
> {
  await connectDb();
  const docs = await Device.find({ user: userId }).sort({ lastSeenAt: -1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    deviceId: d.deviceId,
    deviceName: d.deviceName ?? "Unknown device",
    lastSeenAt: (d.lastSeenAt as Date).toISOString(),
    createdAt: (d.createdAt as Date)?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function removeDevice(userId: string, deviceId: string): Promise<boolean> {
  await connectDb();
  const res = await Device.deleteOne({ user: userId, deviceId });
  return res.deletedCount > 0;
}

export function deviceCookieAttrs(maxAge = DEVICE_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function trackDeviceInBackground(
  userId: string,
  deviceId: string,
  userAgent?: string | null
) {
  const deviceName = describeDevice(userAgent);
  registerDevice(userId, deviceId, deviceName, userAgent)
    .then(() => touchDevice(userId, deviceId, deviceName, userAgent))
    .catch((error) => {
      console.error("device tracking error", error);
    });
}