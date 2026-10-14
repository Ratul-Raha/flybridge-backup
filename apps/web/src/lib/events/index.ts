import { on } from "./registry";
import {
  notifyStaffOnUserRegistered,
  notifyStaffOnRegistration,
  notifyAllOnSeminarCreated,
  notifyAllOnCourseLaunched,
  notifyAllOnResourceCreated,
  notifyAllOnScholarshipCreated,
  notifyStaffOnOrderCreated,
  notifyStaffOnOrderFulfilled,
  recordAffiliateCommission,
  sendTelegramOnEvent,
  refreshKnowledgeBase,
} from "./handlers";
import { EVENT_NAMES, type EventName } from "./types";

export function registerDefaultHandlers(): void {
  on("user.registered", notifyStaffOnUserRegistered);
  on("seminar.registration_created", notifyStaffOnRegistration);
  on("seminar.created", notifyAllOnSeminarCreated);
  on("seminar.created", refreshKnowledgeBase);
  on("seminar.updated", refreshKnowledgeBase);
  on("seminar.deleted", refreshKnowledgeBase);
  on("course.launched", notifyAllOnCourseLaunched);
  on("course.created", refreshKnowledgeBase);
  on("course.updated", refreshKnowledgeBase);
  on("course.deleted", refreshKnowledgeBase);
  on("resource.created", notifyAllOnResourceCreated);
  on("scholarship.created", notifyAllOnScholarshipCreated);
  on("order.created", notifyStaffOnOrderCreated);
  on("order.fulfilled", notifyStaffOnOrderFulfilled);
  on("order.fulfilled", recordAffiliateCommission);

  // Telegram channel notifications — subscribe to every event; the handler
  // self-filters using the per-event opt-in list from BotConfig.channels.
  for (const eventName of EVENT_NAMES as readonly EventName[]) {
    on(eventName, sendTelegramOnEvent);
  }
}

registerDefaultHandlers();
