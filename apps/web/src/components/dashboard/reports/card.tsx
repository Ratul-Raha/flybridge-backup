import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-[clamp(18px,2.5vw,26px)] ${className ?? ""}`}
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
            {subtitle}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}