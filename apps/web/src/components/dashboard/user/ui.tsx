import { Loader2 } from "lucide-react";

export function ScreenLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
      <span className="text-[13.5px]" style={{ color: "var(--body)" }}>
        {label}
      </span>
    </div>
  );
}

export function ScreenError({ message }: { message: string }) {
  return (
    <div
      className="text-[12.5px] rounded-xl border px-4 py-3"
      style={{
        color: "#C0392B",
        borderColor: "rgba(192,57,43,0.25)",
        background: "rgba(192,57,43,0.06)",
      }}
    >
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[24px] border bg-white px-6 py-12 flex flex-col items-center text-center gap-2.5"
      style={{ borderColor: "var(--line)" }}
    >
      <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
        {title}
      </p>
      <p className="text-[13.5px] leading-[1.6] max-w-[380px]" style={{ color: "var(--body)" }}>
        {desc}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
