import {
  BookOpen,
  ListChecks,
  FileText,
  Briefcase,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { resources, type ResourceType } from "@/lib/resources";

const TYPE_ICONS: Record<ResourceType, LucideIcon> = {
  Guide: BookOpen,
  Checklist: ListChecks,
  Template: FileText,
  Toolkit: Briefcase,
  Video: PlayCircle,
};

export function AllResources() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
      {resources.map((r) => {
        const Icon = TYPE_ICONS[r.type];
        return (
          <div
            key={r.id}
            className="rounded-[24px] border bg-white p-6 flex flex-col gap-4"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Icon size={16} strokeWidth={2} />
              </span>
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                style={
                  r.membersOnly
                    ? { background: "rgba(15,169,104,0.12)", color: "#0FA968" }
                    : { background: "var(--bg-soft)", color: "var(--body)" }
                }
              >
                {r.membersOnly ? "Members" : r.type}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-[16px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                {r.title}
              </h3>
              <p className="text-[13px] leading-[1.6]" style={{ color: "var(--body)" }}>
                {r.desc}
              </p>
            </div>

            <span
              className="text-[12.5px] font-medium mt-auto pt-1"
              style={{ color: "var(--brand)" }}
            >
              {r.type} · {r.membersOnly ? "Available to members" : "Open to everyone"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
