"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, ChevronDown } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import { SectionCard, PrimaryButton, StatusPill, EMERALD, AMBER, ROSE, SKY } from "./ui";
import { EmitModal } from "./emit-modal";

type LogItem = {
  id: string;
  name: string;
  status: string;
  handlers: { name: string; status: string; error?: string; durationMs?: number }[];
  automationsRun: number;
  payload: unknown;
  createdAt: string;
};

const LOG_COLORS: Record<string, string> = {
  completed: EMERALD,
  partial: AMBER,
  pending: SKY,
  failed: ROSE,
};

export function EventLogView() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events/log?limit=100", { cache: "no-store" });
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <SectionCard
        title="Event log"
        subtitle="Every event fired across the platform — with built-in handler results and automation runs. Use it to trace and debug workflows."
        action={
          <PrimaryButton onClick={() => setTestOpen(true)}>
            <Play size={14} /> Fire a test event
          </PrimaryButton>
        }
      >
        {loading ? (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--body)" }}>
            Loading…
          </p>
        ) : logs.length === 0 ? (
          <p className="py-10 text-center text-[13px]" style={{ color: "var(--body)" }}>
            No events recorded yet. Events appear here as users register and seminars are created.
          </p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
            {logs.map((log) => {
              const color = LOG_COLORS[log.status] ?? SKY;
              return (
                <div key={log.id} className="py-3">
                  <button
                    className="flex w-full flex-wrap items-center gap-3 text-left"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      {eventLabel(log.name)}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {log.handlers.length} handler{log.handlers.length === 1 ? "" : "s"} · {log.automationsRun} automation run{log.automationsRun === 1 ? "" : "s"}
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      <StatusPill label={log.status} color={color} />
                      <ChevronDown size={14} style={{ color: "var(--body)" }} className={expanded === log.id ? "rotate-180 transition" : "transition"} />
                    </span>
                  </button>

                  {expanded === log.id && (
                    <div className="mt-3 space-y-3 rounded-xl border p-3.5" style={{ borderColor: "var(--line)", background: "#F8FAFD" }}>
                      <div className="flex flex-wrap gap-1.5">
                        {log.handlers.length === 0 && (
                          <span className="text-[12px]" style={{ color: "var(--body)" }}>
                            No built-in handlers for this event.
                          </span>
                        )}
                        {log.handlers.map((h) => (
                          <span
                            key={h.name}
                            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                            style={{ background: `${h.status === "success" ? EMERALD : ROSE}14`, color: h.status === "success" ? EMERALD : ROSE }}
                            title={h.error ?? `${h.durationMs ?? 0}ms`}
                          >
                            {h.name} {h.status === "success" ? `✓ ${h.durationMs ?? 0}ms` : `✗ ${h.error ?? ""}`}
                          </span>
                        ))}
                      </div>
                      <pre
                        className="max-h-56 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed"
                        style={{ background: "#fff", border: "1px solid var(--line)", color: "var(--ink)" }}
                      >
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <EmitModal open={testOpen} onClose={() => setTestOpen(false)} />
    </div>
  );
}
