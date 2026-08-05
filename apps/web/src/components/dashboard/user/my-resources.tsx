import {
  BookOpen,
  ListChecks,
  FileText,
  Briefcase,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { memberResources, type ResourceType } from "@/lib/resources";

const TYPE_ICONS: Record<ResourceType, LucideIcon> = {
  Guide: BookOpen,
  Checklist: ListChecks,
  Template: FileText,
  Toolkit: Briefcase,
  Video: PlayCircle,
};

export function MyResources() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
      {memberResources.map((r) => {
        const Icon = TYPE_ICONS[r.type];
        return (
          <div
            key={r.id}
            className="rounded-[24px] border bg-white p-6 flex flex-col gap-4"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <Icon size={16} strokeWidth={2} />
            </span>

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
              {r.type} · Unlocked for members
            </span>
          </div>
        );
      })}
    </div>
  );
}
