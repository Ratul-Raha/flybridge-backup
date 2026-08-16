"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Gauge, RotateCcw } from "lucide-react";
import { ReadinessResultView } from "@/components/readiness/readiness-result";
import { EmptyState, ScreenError, ScreenLoading } from "@/components/dashboard/user/ui";
import type { StoredReadinessRun } from "@/lib/models/readiness-run";

export function DashboardReadiness() {
  const router = useRouter();
  const [run, setRun] = useState<StoredReadinessRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/me/readiness", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Couldn't load your readiness score");
        return res.json();
      })
      .then((data: { assessment?: StoredReadinessRun | null }) => {
        if (active) setRun(data.assessment ?? null);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <ScreenLoading label="Loading your readiness score…" />;
  if (error) return <ScreenError message={error} />;

  if (!run) {
    return (
      <EmptyState
        title="No readiness score yet"
        desc="Take the free assessment to get your personalized study abroad readiness score and AI action plan."
        action={
          <Link
            href="/readiness"
            className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            Take the assessment
            <ArrowRight size={15} />
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-[20px] border bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ borderColor: "var(--line)" }}
      >
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <Gauge size={24} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            {run.label} · {run.score}/100
          </p>
          <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
            {[run.country, run.degreeLevel].filter(Boolean).join(" · ") || "Study abroad"} ·{" "}
            {new Date(run.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => router.push("/readiness")}
            className="inline-flex items-center gap-2 rounded-full text-[13px] font-semibold px-5 py-[9px] text-white transition-all duration-200 hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <RotateCcw size={13} />
            Retake & regenerate
          </button>
        </div>
      </div>

      {run.report ? (
        <ReadinessResultView
          result={run.result}
          report={run.report}
          generating={false}
          error={null}
          onRetake={() => router.push("/readiness")}
        />
      ) : (
        <div
          className="rounded-[20px] border bg-white p-8 flex flex-col items-center text-center gap-2.5"
          style={{ borderColor: "var(--line)" }}
        >
          <Gauge size={34} style={{ color: "var(--brand)" }} strokeWidth={1.6} />
          <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            Your report text isn&apos;t available for this assessment
          </p>
          <p className="text-[13px] max-w-[420px]" style={{ color: "var(--body)" }}>
            Retake the assessment to generate a fresh, personalized AI report.
          </p>
          <button
            type="button"
            onClick={() => router.push("/readiness")}
            className="mt-3 inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-200 hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            Retake assessment
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
