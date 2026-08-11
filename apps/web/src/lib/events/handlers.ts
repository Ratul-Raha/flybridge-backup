import "server-only";

import {
  sendSeminarRegistrationEmail,
  sendNewSeminarAnnouncement,
  sendCourseLaunchEmail,
} from "@/lib/email";
import { reloadKnowledgeBase } from "@/lib/ai/knowledge";
import { User } from "@/lib/models/user";
import { Notification } from "@/lib/models/notification";
import type { EventPayload } from "./types";
import type { EventHandler } from "./registry";

function seminarEmailData(payload: EventPayload) {
  const s = (payload.seminar ?? {}) as Record<string, unknown>;
  return {
    id: typeof s.id === "string" ? s.id : undefined,
    title: String(s.title ?? ""),
    description: typeof s.description === "string" ? s.description : null,
    dateTime: new Date(String(s.dateTime ?? new Date())),
    duration: typeof s.duration === "string" ? s.duration : null,
    type: (s.type === "paid" ? "paid" : "free") as "free" | "paid",
    price: typeof s.price === "number" ? s.price : 0,
    url: typeof s.url === "string" ? s.url : null,
    image: typeof s.image === "string" ? s.image : null,
  };
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
    await Notification.insertMany(
      recipients.map((r) => ({
        recipient: r._id,
        type: "seminar_registration",
        title: "New seminar registration",
        message: `${registrantName} registered for "${seminarTitle}"`,
        seminar: seminarId,
        registration: registrationId,
      }))
    );
  },
};

export const sendRegistrationConfirmationEmail: EventHandler = {
  name: "sendRegistrationConfirmationEmail",
  run: async (payload) => {
    const user = (payload.user ?? {}) as Record<string, unknown>;
    const result = await sendSeminarRegistrationEmail(
      {
        name: String(user.name ?? ""),
        email: String(user.email ?? ""),
        phone: typeof user.phone === "string" ? user.phone : null,
      },
      seminarEmailData(payload)
    );
    if (!result.ok) throw new Error(result.error ?? "Email send failed");
  },
};

export const announceNewSeminar: EventHandler = {
  name: "announceNewSeminar",
  run: async (payload) => {
    const result = await sendNewSeminarAnnouncement(seminarEmailData(payload));
    if (!result.ok) throw new Error(result.error ?? "Announcement email failed");
  },
};

export const refreshKnowledgeBase: EventHandler = {
  name: "refreshKnowledgeBase",
  run: async () => {
    await reloadKnowledgeBase();
  },
};

export const announceCourseLaunch: EventHandler = {
  name: "announceCourseLaunch",
  run: async (payload) => {
    const c = (payload.course ?? {}) as Record<string, unknown>;
    const result = await sendCourseLaunchEmail({
      slug: String(c.slug ?? ""),
      title: String(c.title ?? ""),
      desc: typeof c.desc === "string" ? c.desc : undefined,
      badge: typeof c.badge === "string" ? c.badge : undefined,
      price: typeof c.price === "string" ? c.price : undefined,
      image: typeof c.image === "string" ? c.image : undefined,
    });
    if (!result.ok) throw new Error(result.error ?? "Course launch email failed");
  },
};


