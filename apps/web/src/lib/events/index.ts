import { on } from "./registry";
import {
  notifyStaffOnUserRegistered,
  notifyStaffOnRegistration,
  notifyAllOnSeminarCreated,
  notifyAllOnCourseLaunched,
  notifyAllOnResourceCreated,
  refreshKnowledgeBase,
} from "./handlers";

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
}

registerDefaultHandlers();
