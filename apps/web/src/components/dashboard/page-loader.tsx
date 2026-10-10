import { Loader2 } from "lucide-react";

/** Full-area loader for screens that fetch from the database on mount. */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 size={26} className="animate-spin" style={{ color: "var(--brand)" }} />
      <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
        {label}
      </p>
    </div>
  );
}

/** Bordered card loader for table/list areas. */
export function CardLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="rounded-lg border bg-white p-16 text-center"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <Loader2 size={28} className="animate-spin mx-auto" style={{ color: "var(--brand)" }} />
      <p className="text-[14px] font-medium mt-5" style={{ color: "var(--body)" }}>
        {label}
      </p>
    </div>
  );
}

/** Compact inline loader for small blocks and sections. */
export function InlineLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Loader2 size={15} className="animate-spin" style={{ color: "var(--brand)" }} />
      <span className="text-[12.5px]" style={{ color: "var(--body)" }}>
        {label}
      </span>
    </div>
  );
}
