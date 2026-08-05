import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { programs } from "@/lib/programs";

export function AllCourses() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
      {programs.map((p) => (
        <Link
          key={p.slug}
          href={`/programs/${p.slug}`}
          className="group rounded-[24px] border bg-white p-6 flex flex-col gap-4 transition-all duration-250 hover:translate-y-[-2px]"
          style={{ borderColor: "var(--line)" }}
        >
          <div
            className="rounded-2xl px-3.5 py-2 w-fit"
            style={{ background: p.bg, color: p.badgeColor }}
          >
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
              {p.badge}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
              {p.title}
            </h3>
            <p className="text-[13.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
              {p.desc}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2">
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
              style={
                p.upcoming
                  ? { background: "var(--bg-soft)", color: "var(--body)" }
                  : { background: "var(--brand-soft)", color: "var(--brand)" }
              }
            >
              {p.upcoming ? "Coming soon" : "Enroll now"}
            </span>
            <ArrowUpRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
              style={{ color: "var(--body)" }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
