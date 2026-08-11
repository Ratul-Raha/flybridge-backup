import { on } from "./registry";
import {
  notifyStaffOnRegistration,
  notifyAllOnSeminarCreated,
  notifyAllOnCourseLaunched,
  notifyAllOnResourceCreated,
  sendRegistrationConfirmationEmail,
  announceNewSeminar,
  announceNewResource,
  refreshKnowledgeBase,
  announceCourseLaunch,
} from "./handlers";

export function registerDefaultHandlers(): void {
  on("seminar.registration_created", notifyStaffOnRegistration);
  on("seminar.registration_created", sendRegistrationConfirmationEmail);
  on("seminar.created", notifyAllOnSeminarCreated);
  on("seminar.created", refreshKnowledgeBase);
  on("seminar.created", announceNewSeminar);
  on("seminar.updated", refreshKnowledgeBase);
  on("seminar.deleted", refreshKnowledgeBase);
  on("course.launched", notifyAllOnCourseLaunched);
  on("course.launched", announceCourseLaunch);
  on("resource.created", notifyAllOnResourceCreated);
  on("resource.created", announceNewResource);
}

registerDefaultHandlers();
