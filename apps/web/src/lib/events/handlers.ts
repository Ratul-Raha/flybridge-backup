import "server-only";

import { reloadKnowledgeBase } from "@/lib/ai/knowledge";
import { User } from "@/lib/models/user";
import { Notification } from "@/lib/models/notification";
import type { EventPayload } from "./types";
import type { EventHandler } from "./registry";

async function insertNotifications(
  recipients: { _id: unknown }[],
  fields: Partial<{
    type: string;
    title: string;
    message: string;
    seminar: string | undefined;
    registration: string | undefined;
    courseSlug: string | undefined;
  }>
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
    }))
  );
}

export const notifyStaffOnRegistration: EventHandler = {
  name: "notifyStaffOnRegistration",
  run: async (payload) => {
    const user = (payload.user ?? {}) as Record<string, unknown>;
    const seminar = (payload.seminar ?? {}) as Record<string, unknown>;
    const registrationId = typeof payload.registrationId === "string" ? payload.registrationId : undefined;
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


