export const RESOURCE_CATEGORIES = [
  "Study Visa",
  "Study Abroad",
  "Scholarships",
  "Career & Jobs",
  "Interviews",
  "English Skills",
  "IELTS",
  "Documents & Templates",
  "Other",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export function isResourceCategory(value: unknown): value is ResourceCategory {
  return typeof value === "string" && (RESOURCE_CATEGORIES as readonly string[]).includes(value);
}
