export const STATUS_META: Record<string, { label: string; fg: string; bg: string }> = {
  new: { label: "New", fg: "#1D4ED8", bg: "rgba(47,95,224,0.12)" },
  contacted: { label: "Contacted", fg: "#475569", bg: "rgba(100,116,139,0.12)" },
  interested: { label: "Interested", fg: "#6B4CE0", bg: "rgba(111,76,224,0.12)" },
  "follow-up": { label: "Follow-up", fg: "#92400E", bg: "rgba(217,119,6,0.12)" },
  converted: { label: "Converted", fg: "#065F46", bg: "rgba(20,181,126,0.12)" },
  "not-interested": { label: "Not interested", fg: "#991B1B", bg: "rgba(239,68,68,0.12)" },
  unqualified: { label: "Unqualified", fg: "#64748B", bg: "rgba(148,163,184,0.14)" },
};

export const SOURCE_LABEL: Record<string, string> = {
  waitlist: "Waitlist",
  seminar: "Seminar",
  inquiry: "Inquiry",
  checkout: "Checkout",
  signup: "Signup",
  manual: "Manual",
};

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, fg: "#475569", bg: "rgba(100,116,139,0.12)" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"
      style={{ color: meta.fg, background: meta.bg }}
    >
      {meta.label}
    </span>
  );
}

export function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
