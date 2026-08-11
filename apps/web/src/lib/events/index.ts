import { on } from "./registry";
import {
  notifyStaffOnRegistration,
  notifyAllOnSeminarCreated,
  notifyAllOnCourseLaunched,
  sendRegistrationConfirmationEmail,
  announceNewSeminar,
  refreshKnowledgeBase,
  announceCourseLaunch,
} from "./handlers";

export function registerDefaultHandlers(): void {
  on("seminar.registration_created", notifyStaffOnRegistration);
  on("seminar.registration_created", sendRegistrationConfirmationEmail);
  on("seminar.created", announceNewSeminar);
  on("seminar.created", notifyAllOnSeminarCreated);
  on("seminar.created", refreshKnowledgeBase);
  on("seminar.updated", refreshKnowledgeBase);
  on("seminar.deleted", refreshKnowledgeBase);
  on("course.launched", announceCourseLaunch);
  on("course.launched", notifyAllOnCourseLaunched);
}
