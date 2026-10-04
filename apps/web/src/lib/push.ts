import "server-only";

import mongoose from "mongoose";
import webpush from "web-push";
import { PushSubscription } from "@/lib/models/push-subscription";
import type { NotificationType } from "@/lib/models/notification";

type VapidDetails = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

function getVapidDetails(): VapidDetails | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

/**
 * Map a notification type to the deep-link the service worker should open,
 * mirroring the bell/notification-center click routing.
 */
export function notificationUrl(
  type: NotificationType,
  links: { seminarId?: string | null; courseSlug?: string | null } = {},
): string {
  switch (type) {
    case "seminar_registration":
      return links.seminarId
        ? `/dashboard/seminars/${links.seminarId}/registrations`
        : "/dashboard/notifications";
    case "seminar_created":
      return "/seminars";
    case "course_launched":
      return links.courseSlug ? `/programs/${links.courseSlug}` : "/programs";
    case "resource_created":
      return "/resources";
    case "scholarship_created":
      return "/dashboard/scholarships";
    case "order_created":
    case "order_fulfilled":
      return "/dashboard/admin/orders";
    default:
      return "/dashboard/notifications";
  }
}

const ICON = "/transparent-logo-dark.png";

/**
 * Send a Chrome web push notification to every registered subscription of the
 * given users. Runs fire-and-forget friendly: failures never throw out of the
 * batch, and expired subscriptions (404/410) are removed automatically.
 */
export async function pushToUsers(
  userIds: Array<string | mongoose.Types.ObjectId>,
  payload: PushPayload,
  opts: { ttlSeconds?: number; urgency?: "high" | "normal" | "low" } = {},
): Promise<{ sent: number; failed: number; removed: number }> {
  if (userIds.length === 0) return { sent: 0, failed: 0, removed: 0 };

  const vapid = getVapidDetails();
  if (!vapid) {
    console.warn("[push] VAPID keys not configured — skipping push notification");
    return { sent: 0, failed: 0, removed: 0 };
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const subs = await PushSubscription.find({ user: { $in: userIds } }).lean();
  if (subs.length === 0) return { sent: 0, failed: 0, removed: 0 };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    icon: ICON,
    badge: ICON,
    tag: payload.title,
    renotify: false,
  });
  const headers = {
    TTL: String(opts.ttlSeconds ?? 86_400),
    Urgency: opts.urgency ?? "normal",
  };

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
        { headers },
      ),
    ),
  );

  let removed = 0;
  let failed = 0;
  const expired: string[] = [];

  results.forEach((res, i) => {
    const sub = subs[i];
    if (res.status === "fulfilled") return;
    const err = res.reason as { statusCode?: number } | undefined;
    failed += 1;
    if (
      err &&
      typeof err.statusCode === "number" &&
      err.statusCode >= 404 &&
      err.statusCode < 500
    ) {
      expired.push(sub.endpoint);
    }
  });

  if (expired.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: expired } });
    removed = expired.length;
  }

  return { sent: subs.length - failed, failed, removed };
}
