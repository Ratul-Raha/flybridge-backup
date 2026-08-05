import Link from "next/link";
import { EmptyState } from "./ui";

export function MyCourses() {
  return (
    <EmptyState
      title="You haven't enrolled in any courses yet"
      desc="Enrolling in a course unlocks step-by-step lessons, practice material and your personal progress tracking."
      action={
        <Link
          href="/dashboard/courses"
          className="inline-block rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
          style={{ background: "var(--brand)" }}
        >
          Browse all courses
        </Link>
      }
    />
  );
}
