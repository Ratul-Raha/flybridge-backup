export const COURSE_CATEGORIES = [
  "IELTS",
  "Spoken English",
  "Study Abroad",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export function isCourseCategory(value: unknown): value is CourseCategory {
  return (
    typeof value === "string" &&
    (COURSE_CATEGORIES as readonly string[]).includes(value)
  );
}