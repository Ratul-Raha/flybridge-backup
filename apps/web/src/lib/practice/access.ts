import "server-only";

import type { Types } from "mongoose";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { flatIndexOf, isFreeLesson } from "@/lib/course-preview";
import type { PracticeSetDto, StudentPracticeSetDto } from "./schema";

type AccessCourse = {
  _id: Types.ObjectId;
  modules?: { lessons?: { freePreview?: boolean | null }[] | null }[] | null;
};

export type PracticeViewer = { userId: string; role?: string | null };

export type PracticeAccess = {
  isStaff: boolean;
  enrolled: boolean;
};

export function isPracticeStaff(role?: string | null): boolean {
  return role === "admin" || role === "moderator";
}

export async function getPracticeAccess(
  viewer: PracticeViewer,
  course: AccessCourse
): Promise<PracticeAccess> {
  if (isPracticeStaff(viewer.role)) {
    return { isStaff: true, enrolled: false };
  }

  const enrolled = Boolean(
    await CourseEnrollment.exists({
      user: viewer.userId,
      course: course._id,
      status: "active",
    })
  );

  return { isStaff: false, enrolled };
}

export function canViewStudentSet(
  set: Pick<PracticeSetDto, "moduleIndex" | "lessonIndex">,
  access: PracticeAccess,
  course: AccessCourse
): boolean {
  if (access.isStaff || access.enrolled) return true;
  if (set.lessonIndex === null) return false;

  const flat = flatIndexOf(course, set.moduleIndex, set.lessonIndex);
  if (flat < 0) return false;

  return isFreeLesson(course.modules?.[set.moduleIndex]?.lessons?.[set.lessonIndex]);
}

export function toStudentSetDto(set: PracticeSetDto): StudentPracticeSetDto {
  const safe: Partial<PracticeSetDto> = { ...set };
  delete safe.s3Key;
  delete safe.fileName;
  return safe as StudentPracticeSetDto;
}
