import Link from "next/link";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { programs } from "@/lib/programs";
import { ProgramCard } from "./program-card";
import { DbCourseCard, type DbCourse } from "./programs/db-course-card";

async function getDbCourses(): Promise<DbCourse[]> {
  try {
    await connectDb();
    const courses = await Course.find({
      $or: [{ published: true }, { upcoming: true }],
    }).sort({ createdAt: -1 });
    return courses.map((c) => ({
      id: c._id.toString(),
      slug: c.slug,
      title: c.title,
      badge: c.badge ?? "",
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      price: c.price ?? 0,
      currency: c.currency ?? "USD",
      image: c.image ?? null,
      level: c.level ?? "",
      upcoming: c.upcoming ?? false,
      modules: (c.modules ?? []).map((m) => ({
        title: m.title,
        lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
      })),
    }));
  } catch {
    return [];
  }
}

export async function Programs() {
  const dbCourses = await getDbCourses();
  const hasDbCourses = dbCourses.length > 0;

  return (
    <section id="programs" className="pt-[110px] px-[clamp(20px,4.5vw,56px)] pb-[100px] max-w-[1320px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div className="max-w-[640px]">
          <h2 className="text-balance">
            <span
              className="block font-display font-medium tracking-[-0.02em] leading-[1.1]"
              style={{ fontSize: "clamp(26px,3vw,38px)", color: "var(--ink)" }}
            >
              Find your <span style={{ color: "var(--brand-2)" }}>program &amp; course</span>
            </span>
          </h2>
          <p className="text-[14.5px] mt-[10px] max-w-[520px]" style={{ color: "var(--body)" }}>
            Everything you need for study abroad and work abroad — all in one place.
          </p>
        </div>
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-[14.5px] font-medium shrink-0 group"
          style={{ color: "var(--brand-2)" }}
        >
          View all programs
          <svg
            className="w-[13px] h-[13px] transition-transform duration-250 group-hover:translate-x-[3px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12H19M19 12L13 6M19 12L13 18" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {programs
          .filter((p) => !(p.hasDb && hasDbCourses))
          .map((p) => (
            <ProgramCard key={p.slug} p={p} />
          ))}
        {dbCourses.map((c) => (
          <DbCourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}
