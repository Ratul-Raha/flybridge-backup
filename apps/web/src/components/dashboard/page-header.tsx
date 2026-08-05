import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        <p className="text-[13.5px] mt-1" style={{ color: "var(--body)" }}>
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}