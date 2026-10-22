import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | FlyBridge Education Group",
};

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-8 w-40 rounded-lg bg-[var(--bg-soft)]" />
        <div className="mt-2 h-4 w-64 rounded-lg bg-[var(--bg-soft)]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--line)" }}>
          <div className="h-5 w-48 rounded-lg bg-[var(--bg-soft)]" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="h-24 rounded-xl bg-[var(--bg-soft)]" />
            <div className="h-24 rounded-xl bg-[var(--bg-soft)]" />
            <div className="h-24 rounded-xl bg-[var(--bg-soft)]" />
            <div className="h-24 rounded-xl bg-[var(--bg-soft)]" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--line)" }}>
          <div className="h-5 w-36 rounded-lg bg-[var(--bg-soft)]" />
          <div className="mt-4 h-40 rounded-xl bg-[var(--bg-soft)]" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--line)" }}>
          <div className="h-5 w-40 rounded-lg bg-[var(--bg-soft)]" />
          <div className="mt-4 flex flex-col gap-2">
            <div className="h-16 rounded-xl bg-[var(--bg-soft)]" />
            <div className="h-16 rounded-xl bg-[var(--bg-soft)]" />
            <div className="h-16 rounded-xl bg-[var(--bg-soft)]" />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--line)" }}>
          <div className="h-5 w-32 rounded-lg bg-[var(--bg-soft)]" />
          <div className="mt-4 flex flex-col gap-2">
            <div className="h-16 rounded-xl bg-[var(--bg-soft)]" />
            <div className="h-16 rounded-xl bg-[var(--bg-soft)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
