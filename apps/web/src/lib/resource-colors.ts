export const RESOURCE_CATEGORY_COLORS: Record<string, string> = {
  "Study Visa": "#2F5FE0",
  "Study Abroad": "#188A5D",
  Scholarships: "#6B4CE0",
  "Career & Jobs": "#DB8A2E",
  Interviews: "#E05D44",
  "English Skills": "#2563EB",
  IELTS: "#0FA968",
  "Documents & Templates": "#8B5CF6",
  Other: "#64748B",
};

export function getCategoryColor(category: string) {
  return RESOURCE_CATEGORY_COLORS[category] ?? "#64748B";
}