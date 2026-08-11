import { on } from "./registry";
import {
  notifyStaffOnRegistration,
  sendRegistrationConfirmationEmail,
  announceNewSeminar,
  refreshKnowledgeBase,
  announceCourseLaunch,
} from "./handlers";

export function registerDefaultHandlers(): void {
  on("seminar.registration_created", notifyStaffOnRegistration);
  on("seminar.registration_created", sendRegistrationConfirmationEmail);
  on("seminar.created", announceNewSeminar);
  on("seminar.created", refreshKnowledgeBase);
  on("seminar.updated", refreshKnowledgeBase);
  on("seminar.deleted", refreshKnowledgeBase);
  on("course.launched", announceCourseLaunch);
}
