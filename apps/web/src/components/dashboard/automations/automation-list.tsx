"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Play, Workflow } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import { createNode, createEdge, triggerEventOf } from "@/lib/automation/graph";
import type { AutomationGraph } from "@/lib/automation/types";
import { SectionCard, StatusPill, PrimaryButton, GhostButton, timeAgo, ACCENT, EMERALD, ROSE, SKY, AMBER } from "./ui";

type AutomationItem = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  nodes: AutomationGraph["nodes"];
  edges: AutomationGraph["edges"];
  createdAt: string;
  updatedAt: string;
  lastRun: { status: string; createdAt: string; eventName: string } | null;
};

const RUN_COLORS: Record<string, string> = {
  completed: EMERALD,
  completed_with_errors: AMBER,
  failed: ROSE,
};

export function AutomationList() {
  const router = useRouter();
  const [items, setItems] = useState<AutomationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/automations", { cache: "no-store" });
      const data = await res.json();
      setItems(data.automations ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createAutomation = async () => {
    const trigger = createNode("trigger");
    const end = createNode("end");
    const graph: AutomationGraph = {
      nodes: [trigger, end],
      edges: [createEdge(trigger.id, end.id)],
    };
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled automation", nodes: graph.nodes, edges: graph.edges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      router.push(`/dashboard/admin/automations/${data.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create");
    }
  };

  const toggleActive = async (item: AutomationItem) => {
    setBusy(item.id);
    try {
      const res = await fetch(`/api/admin/automations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          active: !item.active,
          nodes: item.nodes,
          edges: item.edges,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update");
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusy(null);
    }
  };

  const deleteAutomation = async (item: AutomationItem) => {
    if (!window.confirm(`Delete automation "${item.name}"? This also removes its run history.`)) return;
    try {
      const res = await fetch(`/api/admin/automations/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Workflow automations"
        subtitle="When an event fires, automations run their flow step by step — conditions branch YES / NO, actions send emails, notifications or webhooks."
        action={
          <PrimaryButton onClick={createAutomation}>
            <Plus size={15} strokeWidth={2.5} /> New automation
          </PrimaryButton>
        }
      >
        {loading ? (
          <p className="text-[13px] py-8 text-center" style={{ color: "var(--body)" }}>
            Loading…
          </p>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `${ACCENT}14`, color: ACCENT }}
            >
              <Workflow size={26} strokeWidth={1.8} />
            </div>
            <p className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
              No automations yet
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--body)" }}>
              Create one to react to user sign-ups, seminar registrations, seminar and course launches.
            </p>
            <div className="mt-4">
              <PrimaryButton onClick={createAutomation}>
                <Plus size={15} strokeWidth={2.5} /> Create your first automation
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
            {items.map((item) => {
              const event = triggerEventOf({ nodes: item.nodes, edges: item.edges });
              const runColor = item.lastRun ? RUN_COLORS[item.lastRun.status] ?? SKY : SKY;
              return (
                <div key={item.id} className="flex flex-wrap items-center gap-3 py-4">
                  <Link
                    href={`/dashboard/admin/automations/${item.id}`}
                    className="min-w-0 flex-1 group"
                  >
                    <p className="text-[14px] font-semibold group-hover:text-[#6E4CFF] transition" style={{ color: "var(--ink)" }}>
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-[12px]" style={{ color: "var(--body)" }}>
                      When <span className="font-medium" style={{ color: "var(--ink)" }}>{event ? eventLabel(event) : "no trigger set"}</span>
                      {item.description ? ` · ${item.description}` : ""}
                    </p>
                  </Link>

                  <div className="flex items-center gap-2">
                    {item.lastRun ? (
                      <StatusPill label={item.lastRun.status.replace(/_/g, " ")} color={runColor} />
                    ) : null}
                    <StatusPill label={item.active ? "Active" : "Inactive"} color={item.active ? EMERALD : "#8B93A7"} />
                    {item.lastRun && (
                      <span className="hidden sm:inline text-[11px]" style={{ color: "var(--body)" }}>
                        {timeAgo(item.lastRun.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/admin/automations/${item.id}/runs`}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-medium hover:bg-black/5 transition"
                      style={{ color: "var(--body)" }}
                    >
                      <Play size={13} /> Runs
                    </Link>
                    <GhostButton onClick={() => toggleActive(item)} tone={item.active ? ROSE : EMERALD} disabled={busy === item.id}>
                      {item.active ? "Pause" : "Activate"}
                    </GhostButton>
                    <Link
                      href={`/dashboard/admin/automations/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-full border px-3.5 py-2 text-[13px] font-medium transition hover:bg-black/5"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      <Pencil size={13} /> Edit
                    </Link>
                    <button
                      onClick={() => deleteAutomation(item)}
                      className="rounded-full p-2 text-[#8B93A7] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 transition"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <p className="text-[11.5px] px-1" style={{ color: "var(--body)" }}>
        Events available: user registered · seminar registered · seminar launched · seminar updated · seminar deleted · course launched. You can also fire any event manually from the Event Log page to test a flow.
      </p>
    </div>
  );
}
