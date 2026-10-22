"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "rgba(224,87,46,0.12)", color: "#E0572E" }}
      >
        <AlertTriangle size={26} />
      </div>
      <div>
        <h2 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
          Something went wrong
        </h2>
        <p className="mt-1 text-[14px]" style={{ color: "var(--body)" }}>
          We couldn't load your dashboard. Please try again.
        </p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center rounded-full px-5 py-2 text-[14px] font-semibold text-white"
        style={{ background: "var(--brand)" }}
      >
        Try again
      </button>
    </div>
  );
}
