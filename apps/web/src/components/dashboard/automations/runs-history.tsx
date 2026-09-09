"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import { SectionCard, StatusPill, EMERALD, AMBER, ROSE, ACCENT } from "./ui";

type RunStep = { nodeType: string; status: string; error?: string; detail?: unknown };

type RunItem = {
  id: string;
  eventName: string;
  status: string;
  createdAt: string;
  steps: RunStep[];
};

const RUN_COLORS: Record<string, string> = {
  scheduled: ACCENT,
  completed: EMERALD,
  completed_with_errors: AMBER,
  failed: ROSE,
};

const STEP_LABEL: Record<string, string> = {
  trigger: "Trigger",
  condition: "Condition",
  action: "Action",
  end: "End",
};

export function RunsHistory({ id }: { id: string }) {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/automations/${id}/runs?limit=100`, { cache: "no-store" });
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/admin/automations/${id}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium transition hover:opacity-70"
          style={{ color: "var(--body)" }}
        >
          <ArrowLeft size={14} /> Back to flow
        </Link>
      </div>

      <SectionCard title="Run history" subtitle="Every time this automation reacted to an event, its execution is recorded step by step.">
        {loading ? (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--body)" }}>
            Loading…
          </p>
        ) : runs.length === 0 ? (
          <p className="py-10 text-center text-[13px]" style={{ color: "var(--body)" }}>
            No runs yet. Fire a matching event (or use "Test event" in the editor) and it will appear here.
          </p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
            {runs.map((run) => {
              const color = RUN_COLORS[run.status] ?? AMBER;
              const actions = run.steps.filter((s) => s.nodeType === "action");
              return (
                <div key={run.id} className="py-3">
                  <button
                    className="flex w-full flex-wrap items-center gap-3 text-left"
                    onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                  >
                    <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      {eventLabel(run.eventName)}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {run.steps.length} steps · {actions.length} action{actions.length === 1 ? "" : "s"}
                    </span>
                    <span className="ml-auto">
                      <StatusPill label={run.status.replace(/_/g, " ")} color={color} />
                    </span>
                  </button>

                  {expanded === run.id && (
                    <div className="mt-3 space-y-1.5 rounded-lg border p-3" style={{ borderColor: "var(--line)", background: "#F8FAFD" }}>
                      {run.steps.length === 0 && (
                        <p className="text-[12px]" style={{ color: "var(--body)" }}>
                          No steps executed.
                        </p>
                      )}
                      {run.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-[12px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: step.status === "success" ? EMERALD : step.status === "failed" ? ROSE : AMBER }} />
                          <span className="font-medium" style={{ color: "var(--ink)" }}>
                            {STEP_LABEL[step.nodeType] ?? step.nodeType}
                          </span>
                          {step.status === "failed" && step.error ? (
                            <span style={{ color: ROSE }}>{step.error}</span>
                          ) : (
                            <span style={{ color: "var(--body)" }}>
                              {step.status === "success" && step.detail ? JSON.stringify(step.detail) : step.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
