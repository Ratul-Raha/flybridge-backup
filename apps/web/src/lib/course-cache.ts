import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateUserDashboard } from "@/lib/dashboard/tags";

export const COURSES_TAG = "courses";

export function revalidateCourseListings(...slugs: (string | undefined)[]): void {
  revalidateTag(COURSES_TAG);
  revalidateUserDashboard();
  revalidatePath("/");
  revalidatePath("/programs");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/programs/${slug}`);
  }
}
