"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Play, FlaskConical, History, Trash2 } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import { createNode, createEdge, triggerEventOf, graphValidationErrors } from "@/lib/automation/graph";
import type { AutomationGraph, AutomationNode, AutomationNodeType } from "@/lib/automation/types";
import { FlowGraph } from "./flow-graph";
import { NodeConfig } from "./node-config";
import { EmitModal } from "./emit-modal";
import { SectionCard, PrimaryButton, GhostButton, StatusPill, EMERALD, AMBER, ROSE, ACCENT, fieldClass, Label } from "./ui";

type RunItem = {
  id: string;
  eventName: string;
  status: string;
  createdAt: string;
  steps: { nodeType: string; status: string; error?: string }[];
};

export function AutomationEditor({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(false);
  const [nodes, setNodes] = useState<AutomationNode[]>([]);
  const [edges, setEdges] = useState<AutomationGraph["edges"]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [testOpen, setTestOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/automations/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setName(data.name);
      setDescription(data.description ?? "");
      setActive(data.active === true);
      setNodes(data.nodes ?? []);
      setEdges(data.edges ?? []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/automations/${id}/runs?limit=10`, { cache: "no-store" });
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch {
      setRuns([]);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns, active]);

  const addStep = (source: AutomationNode, branch: "true" | "false" | null, type: AutomationNodeType) => {
    const node = createNode(type);
    if (type === "action") {
      node.data.actionType = "send_email";
      node.data.to = { mode: "path", value: "user.email" };
    }
    const edge = createEdge(source.id, node.id, branch ?? undefined);
    setNodes((prev) => [...prev, node]);
    setEdges((prev) => [...prev, edge]);
    setSelectedId(node.id);
  };

  const updateNode = (node: AutomationNode) => {
    setNodes((prev) => prev.map((n) => (n.id === node.id ? node : n)));
  };

  const deleteNode = (node: AutomationNode) => {
    setNodes((prev) => prev.filter((n) => n.id !== node.id));
    setEdges((prev) => prev.filter((e) => e.source !== node.id && e.target !== node.id));
    if (selectedId === node.id) setSelectedId(null);
  };

  const save = async () => {
    const errors = graphValidationErrors({ nodes, edges });
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, active, nodes, edges }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSavedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const removeAutomation = async () => {
    try {
      const res = await fetch(`/api/admin/automations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/dashboard/admin/automations");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const triggerEvent = triggerEventOf({ nodes, edges });
  const validationErrors = graphValidationErrors({ nodes, edges });

  if (loading) {
    return <p className="py-10 text-center text-[13px]" style={{ color: "var(--body)" }}>Loading…</p>;
  }

  if (notFound) {
    return (
      <div className="py-16 text-center">
        <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          Automation not found
        </p>
        <div className="mt-4">
          <Link href="/dashboard/admin/automations" className="text-[13px] font-medium" style={{ color: ACCENT }}>
            ← Back to automations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/admin/automations"
          className="inline-flex items-center gap-1 text-[13px] font-medium transition hover:opacity-70"
          style={{ color: "var(--body)" }}
        >
          <ArrowLeft size={14} /> Automations
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <GhostButton onClick={() => setConfirmDelete(true)} tone={ROSE}>
            <Trash2 size={13} /> Delete
          </GhostButton>
          <GhostButton onClick={() => setTestOpen(true)}>
            <FlaskConical size={13} /> Test event
          </GhostButton>
          <Link
            href={`/dashboard/admin/automations/${id}/runs`}
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition hover:bg-black/5"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <History size={13} /> Run history
          </Link>
          <PrimaryButton onClick={save} disabled={saving}>
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </div>

      <SectionCard
        title="Flow builder"
        subtitle="Click a step to configure it. Use + on a step to add the next one — conditions split into YES / NO branches."
        action={
          <button
            onClick={() => {
              setActive(!active);
              setSavedAt(null);
            }}
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition"
            style={{ borderColor: active ? `${EMERALD}66` : "var(--line)", color: active ? EMERALD : "var(--body)", background: active ? `${EMERALD}0D` : "#fff" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: active ? EMERALD : "#B6BDCC" }} />
            {active ? "Active" : "Inactive"}
          </button>
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <FlowGraph
            nodes={nodes}
            edges={edges}
            selectedId={selectedId}
            onSelect={(n) => setSelectedId(n.id)}
            onAdd={addStep}
            onDelete={deleteNode}
          />

          <div>
            <div className="space-y-3.5 rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "#F8FAFD" }}>
              <Label>Name</Label>
              <input className={fieldClass()} value={name} onChange={(e) => setName(e.target.value)} />
              <Label>Description (optional)</Label>
              <input
                className={fieldClass()}
                placeholder="e.g. Confirm + notify staff when someone registers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex items-center justify-between text-[12px] font-medium" style={{ color: "var(--body)" }}>
                <span>Trigger: {triggerEvent ? eventLabel(triggerEvent) : "none"}</span>
                {savedAt && <span style={{ color: EMERALD }}>Saved ✓</span>}
              </div>
            </div>

            <div className="mt-4">
              {selected ? (
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: "var(--ink)" }}>
                      {selected.type === "trigger" ? "Trigger" : selected.type === "condition" ? "Condition" : selected.type === "end" ? "End" : "Action"}
                    </p>
                    <button
                      onClick={() => deleteNode(selected)}
                      className="rounded-full p-1.5 text-[#B6BDCC] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 transition"
                      aria-label="Remove step"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <NodeConfig node={selected} graph={{ nodes, edges }} onChange={updateNode} />
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed p-4 text-center text-[12.5px]" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                  Select a step to configure it.
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-medium" style={{ background: `${ROSE}10`, color: ROSE }}>
            {error}
          </p>
        )}
        {validationErrors.length > 0 && (
          <p className="mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-medium" style={{ background: `${AMBER}12`, color: "#B45309" }}>
            Flow check: {validationErrors[0]}
          </p>
        )}
      </SectionCard>

      {runs.length > 0 && (
        <SectionCard title="Recent runs" subtitle="Latest executions of this automation" action={<StatusPill label={active ? "Watching events" : "Paused"} color={active ? EMERALD : "#8B93A7"} />}>
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
            {runs.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center gap-3 py-2.5">
                <span className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  {eventLabel(run.eventName)}
                </span>
                <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  {new Date(run.createdAt).toLocaleString()}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {run.steps
                    .filter((s) => s.nodeType === "action")
                    .map((s, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: s.status === "success" ? EMERALD : s.status === "failed" ? ROSE : AMBER }}
                        title={s.error ?? s.status}
                      />
                    ))}
                  <StatusPill label={run.status.replace(/_/g, " ")} color={run.status === "completed" ? EMERALD : run.status === "failed" ? ROSE : AMBER} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <EmitModal open={testOpen} onClose={() => setTestOpen(false)} defaultEvent={triggerEvent ?? undefined} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(18,22,42,0.5)" }}>
          <div className="w-full max-w-md rounded-[22px] bg-white p-6" style={{ border: "1px solid var(--line)" }}>
            <h3 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
              Delete this automation?
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--body)" }}>
              "{name}" will be removed along with its run history. This can't be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <GhostButton onClick={() => setConfirmDelete(false)}>Cancel</GhostButton>
              <button
                onClick={removeAutomation}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-white"
                style={{ background: ROSE }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
