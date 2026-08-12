"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import { Modal, PrimaryButton, GhostButton, StatusPill, EMERALD, AMBER, ROSE } from "./ui";

type CatalogEvent = {
  name: string;
  label: string;
  description: string;
  fields: string[];
  samplePayload: Record<string, unknown>;
};

type EmitResponse = {
  ok: boolean;
  logId: string;
  handlers: Record<string, { ok: boolean; error?: string }>;
  runs: { automationId: string; automationName: string; status: string }[];
};

export function EmitModal({
  open,
  onClose,
  defaultEvent,
}: {
  open: boolean;
  onClose: () => void;
  defaultEvent?: string;
}) {
  const [events, setEvents] = useState<CatalogEvent[]>([]);
  const [event, setEvent] = useState(defaultEvent ?? "");
  const [payload, setPayload] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmitResponse | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    fetch("/api/admin/events", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = (data.events ?? []) as CatalogEvent[];
        setEvents(list);
        const initial = event || defaultEvent || list[0]?.name || "";
        setEvent(initial);
        const found = list.find((e) => e.name === initial);
        if (found) setPayload(JSON.stringify(found.samplePayload, null, 2));
      })
      .catch(() => setEvents([]));
  }, [open, defaultEvent]);

  const selectEvent = (name: string) => {
    setEvent(name);
    const found = events.find((e) => e.name === name);
    if (found) setPayload(JSON.stringify(found.samplePayload, null, 2));
  };

  const emit = async () => {
    setError(null);
    setResult(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setError("Payload is not valid JSON.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload: parsed }),
      });
      const data = (await res.json()) as EmitResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Emit failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Request failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Send a test event" width={640}>
      <div className="space-y-4">
        <div>
          <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--body)" }}>
            Event
          </label>
          <select
            className="w-full rounded-xl border bg-white px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#6E4CFF]/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            value={event}
            onChange={(e) => selectEvent(e.target.value)}
          >
            {events.map((e) => (
              <option key={e.name} value={e.name}>
                {e.label} — {e.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11.5px]" style={{ color: "var(--body)" }}>
            {events.find((e) => e.name === event)?.description}
          </p>
        </div>
        <div>
          <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--body)" }}>
            Payload (JSON)
          </label>
          <textarea
            className="w-full min-h-[220px] resize-y rounded-xl border bg-[#F8FAFD] p-3 font-mono text-[12px] leading-relaxed outline-none focus:ring-2 focus:ring-[#6E4CFF]/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="text-[12.5px] font-medium" style={{ color: ROSE }}>
            {error}
          </p>
        )}

        {result && (
          <div className="rounded-xl border p-3.5 space-y-2" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                Event fired — log #{result.logId.slice(-6)}
              </p>
              <StatusPill label="ok" color={EMERALD} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(result.handlers).map(([name, h]) => (
                <span key={name} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${h.ok ? EMERALD : ROSE}14`, color: h.ok ? EMERALD : ROSE }}>
                  {name} {h.ok ? "✓" : `✗ ${h.error ?? ""}`}
                </span>
              ))}
            </div>
            {result.runs.length > 0 ? (
              <div className="space-y-1">
                {result.runs.map((r) => (
                  <div key={r.automationId} className="flex items-center justify-between text-[12px]">
                    <span className="font-medium" style={{ color: "var(--ink)" }}>
                      {r.automationName}
                    </span>
                    <StatusPill
                      label={r.status.replace(/_/g, " ")}
                      color={r.status === "completed" ? EMERALD : r.status === "failed" ? ROSE : AMBER}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: "var(--body)" }}>
                No active automations reacted to {eventLabel(event)}.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <GhostButton onClick={onClose}>Close</GhostButton>
          <PrimaryButton onClick={emit} disabled={sending}>
            {sending ? <Loader2 size={13} className="animate-spin" /> : null}
            {sending ? "Firing…" : "Fire event"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
