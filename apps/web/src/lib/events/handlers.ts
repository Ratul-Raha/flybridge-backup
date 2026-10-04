import "server-only";

import mongoose from "mongoose";
import { reloadKnowledgeBase } from "@/lib/ai/knowledge";
import { User } from "@/lib/models/user";
import { Notification } from "@/lib/models/notification";
import { BotConfig } from "@/lib/models/bot-config";
import { notificationUrl, pushToUsers } from "@/lib/push";
import { sendTelegramMessage, formatEventMessage } from "@/lib/notifications/telegram";
import type { NotificationType } from "@/lib/models/notification";
import type { EventName, EventPayload } from "./types";
import type { EventHandler } from "./registry";

// Telegram is intentionally limited to order activity only. Everything else is
// delivered in-app (or via web push) so admins aren't spammed on chat.
const TELEGRAM_EVENT_WHITELIST: EventName[] = [
  "order.created",
  "order.fulfilled",
  "course.enrolled",
];

async function insertNotifications(
  recipients: { _id: unknown }[],
  fields: Partial<{
    type: string;
    title: string;
    message: string;
    seminar: string | undefined;
    registration: string | undefined;
    courseSlug: string | undefined;
  }>,
) {
  if (recipients.length === 0) return;
  await Notification.insertMany(
    recipients.map((r) => ({
      recipient: r._id,
      type: fields.type ?? "seminar_registration",
      title: fields.title ?? "",
      message: fields.message ?? "",
      seminar: fields.seminar,
      registration: fields.registration,
      courseSlug: fields.courseSlug,
    })),
  );

  const userIds = recipients.map((r) => r._id as mongoose.Types.ObjectId);
  void pushToUsers(userIds, {
    title: fields.title ?? "",
    body: fields.message ?? "",
    url: notificationUrl((fields.type ?? "seminar_registration") as NotificationType, {
      seminarId: fields.seminar,
      courseSlug: fields.courseSlug,
    }),
  }).catch((error) => {
    console.error("[push] failed to send event notification:", error);
  });
}

export const notifyStaffOnUserRegistered: EventHandler = {
  name: "notifyStaffOnUserRegistered",
  run: async (payload) => {
    const user = (payload.user ?? {}) as Record<string, unknown>;
    const userId = typeof user.id === "string" ? user.id : undefined;

    const recipients = await User.find({
      accountType: { $in: ["admin", "moderator"] },
      ...(userId ? { _id: { $ne: userId } } : {}),
    })
      .select("_id")
      .lean();
    if (recipients.length === 0) return;

    const newUserName = String(user.name ?? "");
    const email = String(user.email ?? "");
    await insertNotifications(recipients, {
      type: "user_registered",
      title: "New user registered",
      message: `${newUserName}${email ? ` (${email})` : ""} just created a FlyBridge account.`,
    });
  },
};

export const notifyStaffOnRegistration: EventHandler = {
  name: "notifyStaffOnRegistration",
  run: async (payload) => {
    const user = (payload.user ?? {}) as Record<string, unknown>;
    const seminar = (payload.seminar ?? {}) as Record<string, unknown>;
    const registrationId =
      typeof payload.registrationId === "string" ? payload.registrationId : undefined;
    const seminarId = typeof seminar.id === "string" ? seminar.id : undefined;
    const userId = typeof user.id === "string" ? user.id : undefined;

    const recipients = await User.find({
      accountType: { $in: ["admin", "moderator"] },
      ...(userId ? { _id: { $ne: userId } } : {}),
    })
      .select("_id")
      .lean();
    if (recipients.length === 0) return;

    const registrantName = String(user.name ?? "");
    const seminarTitle = String(seminar.title ?? "");
    await insertNotifications(recipients, {
      type: "seminar_registration",
      title: "New seminar registration",
      message: `${registrantName} registered for "${seminarTitle}"`,
      seminar: seminarId,
      registration: registrationId,
    });
  },
};

export const notifyStaffOnOrderCreated: EventHandler = {
  name: "notifyStaffOnOrderCreated",
  run: async (payload) => {
    const user = (payload.user ?? {}) as Record<string, unknown>;
    const order = (payload.order ?? {}) as Record<string, unknown>;
    const userId = typeof user.id === "string" ? user.id : undefined;

    const recipients = await User.find({
      accountType: { $in: ["admin", "moderator"] },
      ...(userId ? { _id: { $ne: userId } } : {}),
    })
      .select("_id")
      .lean();
    if (recipients.length === 0) return;

    const buyerName = String(user.name ?? "");
    const orderId = String(order.id ?? "").slice(-8);
    await insertNotifications(recipients, {
      type: "order_created",
      title: "New order placed",
      message: `${buyerName}${orderId ? ` placed order #${orderId}` : " placed a new order"}.`,
    });
  },
};

export const notifyStaffOnOrderFulfilled: EventHandler = {
  name: "notifyStaffOnOrderFulfilled",
  run: async (payload) => {
    const user = (payload.user ?? {}) as Record<string, unknown>;
    const order = (payload.order ?? {}) as Record<string, unknown>;
    const userId = typeof user.id === "string" ? user.id : undefined;

    const recipients = await User.find({
      accountType: { $in: ["admin", "moderator"] },
      ...(userId ? { _id: { $ne: userId } } : {}),
    })
      .select("_id")
      .lean();
    if (recipients.length === 0) return;

    const buyerName = String(user.name ?? "");
    const orderId = String(order.id ?? "").slice(-8);
    await insertNotifications(recipients, {
      type: "order_fulfilled",
      title: "Payment confirmed",
      message: `${buyerName}${orderId ? `'s order #${orderId}` : "'s order"} payment was confirmed.`,
    });
  },
};

export const notifyAllOnSeminarCreated: EventHandler = {
  name: "notifyAllOnSeminarCreated",
  run: async (payload) => {
    const seminar = (payload.seminar ?? {}) as Record<string, unknown>;
    const seminarId = typeof seminar.id === "string" ? seminar.id : undefined;
    const seminarTitle = String(seminar.title ?? "");

    const recipients = await User.find().select("_id").lean();
    if (recipients.length === 0) return;

    await insertNotifications(recipients, {
      type: "seminar_created",
      title: "New seminar published",
      message: `"${seminarTitle}" is now live — check it out and register.`,
      seminar: seminarId,
    });
  },
};

export const notifyAllOnCourseLaunched: EventHandler = {
  name: "notifyAllOnCourseLaunched",
  run: async (payload) => {
    const course = (payload.course ?? {}) as Record<string, unknown>;
    const slug = typeof course.slug === "string" ? course.slug : undefined;
    const courseTitle = String(course.title ?? "");

    const recipients = await User.find().select("_id").lean();
    if (recipients.length === 0) return;

    await insertNotifications(recipients, {
      type: "course_launched",
      title: "New course available",
      message: `"${courseTitle}" has just launched — start learning today.`,
      courseSlug: slug,
    });
  },
};

export const refreshKnowledgeBase: EventHandler = {
  name: "refreshKnowledgeBase",
  run: async () => {
    await reloadKnowledgeBase();
  },
};

export const notifyAllOnResourceCreated: EventHandler = {
  name: "notifyAllOnResourceCreated",
  run: async (payload) => {
    const resource = (payload.resource ?? {}) as Record<string, unknown>;
    const resourceTitle = String(resource.title ?? "");

    const recipients = await User.find().select("_id").lean();
    if (recipients.length === 0) return;

    await insertNotifications(recipients, {
      type: "resource_created",
      title: "New resource available",
      message: `"${resourceTitle}" has just been published — check it out.`,
    });
  },
};

export const notifyAllOnScholarshipCreated: EventHandler = {
  name: "notifyAllOnScholarshipCreated",
  run: async (payload) => {
    const scholarship = (payload.scholarship ?? {}) as Record<string, unknown>;
    const title = String(scholarship.title ?? "");
    const institution = String(scholarship.institution ?? "");

    const recipients = await User.find().select("_id").lean();
    if (recipients.length === 0) return;

    await insertNotifications(recipients, {
      type: "scholarship_created",
      title: "New scholarship available",
      message: `${title}${institution ? ` at ${institution}` : ""} has just been published — apply before the deadline.`,
    });
  },
};

export const sendTelegramOnEvent: EventHandler = {
  name: "sendTelegramOnEvent",
  run: async (payload, eventName) => {
    const config = await BotConfig.findOne().lean();
    const telegram = (
      config?.channels as
        | {
            telegram?: {
              enabled?: boolean;
              botToken?: string;
              chatIds?: string[];
              events?: string[];
            };
          }
        | undefined
    )?.telegram;

    if (!telegram?.enabled || !telegram.botToken || !telegram.chatIds?.length) return;
    if (!TELEGRAM_EVENT_WHITELIST.includes(eventName)) return;
    if (!telegram.events?.includes(eventName as string)) return;

    const text = formatEventMessage(eventName, payload as Record<string, unknown>);

    // Send to all configured chat IDs; failures are caught per chat so a single
    // bad chat ID can't block the event pipeline.
    for (const chatId of telegram.chatIds) {
      if (!chatId) continue;
      try {
        await sendTelegramMessage(telegram.botToken, chatId, text, "HTML");
      } catch (error) {
        console.error(
          `[telegram] failed to send "${eventName}" to ${chatId}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  },
};
