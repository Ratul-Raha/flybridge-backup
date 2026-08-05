"use client";

import Link from "next/link";

const LABELS: Record<string, [string, string]> = {
  seminars: ["All seminars", "My seminars"],
  courses: ["All courses", "My courses"],
  resources: ["All resources", "My resources"],
};

export type SectionParent = keyof typeof LABELS;

export function SectionTabs({
  parent,
  active,
}: {
  parent: SectionParent;
  active: "all" | "mine";
}) {
  const [allLabel, mineLabel] = LABELS[parent];
  const tabs = [
    { id: "all" as const, label: allLabel, href: `/dashboard/${parent}` },
    { id: "mine" as const, label: mineLabel, href: `/dashboard/${parent}/mine` },
  ];

  return (
    <div
      className="inline-flex rounded-full border p-1 gap-1"
      style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className="rounded-full px-4 py-[7px] text-[13px] font-medium transition-colors duration-200"
          style={
            active === t.id
              ? { background: "var(--brand)", color: "#fff" }
              : { color: "var(--body)" }
          }
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
