"use client";

import { Fragment, useMemo, useState } from "react";
import { Zap, GitBranch, Mail, Bell, Webhook, Timer, Flag, Plus, X } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import { emailTemplateById } from "@/lib/automation/email-templates";
import type { AutomationNode, AutomationEdge, AutomationNodeType, ActionType } from "@/lib/automation/types";
import { EMERALD, AMBER, ACCENT, ROSE } from "./ui";

const TYPE_META: Record<AutomationNodeType, { color: string; bg: string; icon: typeof Zap; label: string }> = {
  trigger: { color: EMERALD, bg: `${EMERALD}14`, icon: Zap, label: "Trigger" },
  condition: { color: AMBER, bg: `${AMBER}16`, icon: GitBranch, label: "Condition" },
  action: { color: ACCENT, bg: `${ACCENT}14`, icon: Mail, label: "Action" },
  end: { color: "#8B93A7", bg: "#8B93A714", icon: Flag, label: "End" },
};

const ACTION_LABEL: Record<ActionType, { label: string; icon: typeof Mail }> = {
  send_email: { label: "Send email", icon: Mail },
  send_notification: { label: "Send notification", icon: Bell },
  webhook: { label: "Webhook", icon: Webhook },
  delay: { label: "Delay", icon: Timer },
};

const OP_LABEL: Record<string, string> = {
  equals: "is",
  not_equals: "is not",
  contains: "contains",
  not_contains: "does not contain",
  exists: "exists",
  not_exists: "does not exist",
  gt: ">",
  lt: "<",
  has_enrolled: "has enrolled in (course)",
  has_resource_download: "has downloaded a resource",
  has_readiness_run: "has completed readiness",
  has_certificate: "has a certificate",
  progress_gte: "course progress ≥",
  progress_lt: "course progress <",
};

export type StepItem = { type: AutomationNodeType; actionType?: ActionType };

function summaryOf(node: AutomationNode): string {
  switch (node.type) {
    case "trigger":
      return node.data.event ? `When ${eventLabel(node.data.event)}` : "Select an event";
    case "condition": {
      const field = node.data.field || "field";
      const op = OP_LABEL[node.data.operator ?? "equals"] ?? "is";
      return `${field} ${op}${node.data.value ? ` "${node.data.value}"` : ""}`;
    }
    case "action": {
      const meta = ACTION_LABEL[node.data.actionType ?? "send_email"];
      if (node.data.actionType === "delay") {
        return `Wait ${node.data.duration ?? 0} ${node.data.unit ?? "minutes"}`;
      }
      if (node.data.actionType === "webhook") return node.data.url ? node.data.url : "Add webhook URL";
      if (node.data.actionType === "send_email") {
        const to =
          node.data.to?.mode === "fixed"
            ? node.data.to.value.split(/[,\n]/)[0]
            : node.data.to?.mode === "role"
              ? "all users"
              : node.data.to?.value || "recipient";
        const template = node.data.templateId ? emailTemplateById(node.data.templateId) : undefined;
        return `${template?.name || node.data.subject || "Email"} → ${to}`.slice(0, 60);
      }
      return node.data.title || "Notification message";
    }
    case "end":
      return "The flow ends here";
  }
}

function chainFrom(
  startId: string | null,
  byId: Map<string, AutomationNode>,
  edges: AutomationEdge[]
): AutomationNode[] {
  const result: AutomationNode[] = [];
  const seen = new Set<string>();
  const visit = (id: string, depth: number) => {
    if (!byId.has(id) || seen.has(id) || depth > 200) return;
    seen.add(id);
    result.push(byId.get(id)!);
    const next = edges
      .filter((e) => e.source === id && !e.sourceHandle)
      .map((e) => e.target);
    for (const t of next) visit(t, depth + 1);
  };
  if (startId) visit(startId, 0);
  return result;
}

function branchOf(
  node: AutomationNode,
  handle: "true" | "false",
  byId: Map<string, AutomationNode>,
  edges: AutomationEdge[]
): AutomationNode[] {
  const heads = edges.filter((e) => e.source === node.id && e.sourceHandle === handle).map((e) => e.target);
  return chainFrom(heads[0] ?? null, byId, edges);
}

type PickerTarget = { source: AutomationNode | null; branch: "true" | "false" | null };

const PICKER_GROUPS: {
  label: string;
  accent: string;
  items: { key: string; name: string; desc: string; icon: typeof Zap }[];
}[] = [
  {
    label: "Triggers",
    accent: EMERALD,
    items: [{ key: "trigger", name: "When event fires", desc: "Starts the flow on a platform event", icon: Zap }],
  },
  {
    label: "Conditions",
    accent: AMBER,
    items: [
      {
        key: "condition",
        name: "Check a rule",
        desc: "Test a field from the event data, then branch YES / NO",
        icon: GitBranch,
      },
    ],
  },
  {
    label: "Actions",
    accent: ACCENT,
    items: [
      { key: "action:send_email", name: "Send email", desc: "Email users, subscribers or fixed addresses", icon: Mail },
      { key: "action:send_notification", name: "Send notification", desc: "In-app alert for admins or users", icon: Bell },
      { key: "action:delay", name: "Delay", desc: "Pause the flow (up to 365 days, resumes via cron)", icon: Timer },
      { key: "action:webhook", name: "Webhook", desc: "POST the event payload to an external URL", icon: Webhook },
    ],
  },
  {
    label: "End",
    accent: "#8B93A7",
    items: [{ key: "end", name: "End flow", desc: "Stops the flow here", icon: Flag }],
  },
];

export function FlowGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}: {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  selectedId: string | null;
  onSelect: (node: AutomationNode) => void;
  onAdd: (source: AutomationNode | null, branch: "true" | "false" | null, items: StepItem[]) => void;
  onDelete: (node: AutomationNode) => void;
}) {
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const startId = nodes.find((n) => n.type === "trigger")?.id ?? nodes[0]?.id ?? null;
  const main = useMemo(() => chainFrom(startId, byId, edges), [startId, byId, edges]);
  const hasTrigger = nodes.some((n) => n.type === "trigger");

  return (
    <div
      className="overflow-auto rounded-lg border bg-[#F8FAFD]"
      style={{ borderColor: "var(--line)", maxHeight: "62vh" }}
    >
      <div className="mx-auto flex w-fit flex-col items-center px-10 py-8">
        {main.length === 0 ? (
          <button
            onClick={() => setPicker({ source: null, branch: null })}
            className="flex items-center gap-2 rounded-xl border-2 border-dashed bg-white px-8 py-5 text-[13px] font-medium transition hover:bg-black/5"
            style={{ borderColor: "#CCC", color: "var(--body)" }}
          >
            <Plus size={15} strokeWidth={2.5} style={{ color: "#999" }} /> Add first step
          </button>
        ) : (
          main.map((node, i) => (
            <Fragment key={node.id}>
              {i > 0 && <Connector />}
              <NodeBlock
                node={node}
                selected={selectedId === node.id}
                onSelect={() => onSelect(node)}
                onDelete={() => onDelete(node)}
              />
              {node.type === "condition" && (
                <div className="mt-4 w-full">
                  <div className="flex items-start justify-center gap-10">
                    {(["true", "false"] as const).map((handle) => (
                      <BranchColumn
                        key={handle}
                        handle={handle}
                        nodes={branchOf(node, handle, byId, edges)}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onAddStep={() => setPicker({ source: node, branch: handle })}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <AddCircle
                  onClick={() => setPicker({ source: node, branch: null })}
                  title={`Add step after "${TYPE_META[node.type].label.toLowerCase()}"`}
                />
              </div>
            </Fragment>
          ))
        )}
      </div>

      {picker && (
        <NodePicker
          target={picker}
          hasTrigger={hasTrigger}
          onAdd={(items) => {
            onAdd(picker.source, picker.branch, items);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function Connector() {
  return <div className="h-4 w-[2px]" style={{ background: "#D9DFEA" }} />;
}

function AddCircle({ onClick, title, small }: { onClick: () => void; title?: string; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title ?? "Add step"}
      className="flex items-center justify-center rounded-full border-2 border-dashed bg-white transition hover:border-black/40 hover:bg-black/5"
      style={{ width: small ? 30 : 36, height: small ? 30 : 36, borderColor: "#CCC", color: "#999" }}
    >
      <Plus size={small ? 11 : 14} strokeWidth={2.5} />
    </button>
  );
}

function NodeBlock({
  node,
  selected,
  onSelect,
  onDelete,
  compact,
}: {
  node: AutomationNode;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const meta = TYPE_META[node.type];
  const actionMeta = node.type === "action" ? ACTION_LABEL[node.data.actionType ?? "send_email"] : null;
  const Icon = actionMeta ? actionMeta.icon : meta.icon;
  const name =
    node.type === "trigger"
      ? "When event fires"
      : node.type === "condition"
        ? "Check a condition"
        : node.type === "end"
          ? "End of flow"
          : actionMeta?.label ?? "Action";

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-xl border bg-white transition"
      style={{
        width: compact ? 240 : 300,
        borderColor: selected ? meta.color : "var(--line)",
        boxShadow: selected ? `0 0 0 3px ${meta.color}26, 0 10px 24px -12px rgba(18,22,42,0.18)` : "0 1px 2px rgba(16,24,40,0.06)",
      }}
    >
      <div className="flex items-center gap-2 p-3.5 pb-0">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: meta.bg, color: meta.color }}>
          <Icon size={13} strokeWidth={2.4} />
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete step"
          className="ml-auto rounded-full p-1 text-[#B6BDCC] transition hover:bg-[#F43F5E]/10 hover:text-[#F43F5E]"
        >
          <X size={13} />
        </button>
      </div>

      <p className="px-3.5 pt-2 text-[14px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
        {name}
      </p>
      <p className="px-3.5 pt-0.5 text-[11.5px] leading-snug break-words" style={{ color: "var(--body)" }}>
        {summaryOf(node)}
      </p>

      <div className="p-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="w-full rounded-lg border py-2 text-[12px] font-semibold transition hover:bg-black/5"
          style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#FFF" }}
        >
          Configure
        </button>
      </div>
    </div>
  );
}

function BranchColumn({
  handle,
  nodes,
  selectedId,
  onSelect,
  onDelete,
  onAddStep,
}: {
  handle: "true" | "false";
  nodes: AutomationNode[];
  selectedId: string | null;
  onSelect: (node: AutomationNode) => void;
  onDelete: (node: AutomationNode) => void;
  onAddStep: () => void;
}) {
  const color = handle === "true" ? EMERALD : ROSE;
  return (
    <div className="flex w-[260px] flex-col items-center">
      <span
        className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider"
        style={{ background: `${color}14`, color }}
      >
        {handle === "true" ? "YES" : "NO"}
      </span>
      <Connector />
      {nodes.length === 0 ? (
        <p className="my-2 text-[11px]" style={{ color: "var(--body)" }}>
          empty
        </p>
      ) : (
        nodes.map((n, i) => (
          <Fragment key={n.id}>
            {i > 0 && <Connector />}
            <NodeBlock node={n} compact selected={selectedId === n.id} onSelect={() => onSelect(n)} onDelete={() => onDelete(n)} />
          </Fragment>
        ))
      )}
      <div className="mt-3">
        <AddCircle small onClick={onAddStep} title={`Add step to ${handle === "true" ? "YES" : "NO"} branch`} />
      </div>
    </div>
  );
}

function NodePicker({
  target,
  hasTrigger,
  onAdd,
  onClose,
}: {
  target: PickerTarget;
  hasTrigger: boolean;
  onAdd: (items: StepItem[]) => void;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);
  const inBranch = target.branch !== null;

  const toggle = (key: string) => {
    setChecked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const disabledKey = (key: string) => {
    if (key === "trigger") return hasTrigger;
    if (key === "condition") return inBranch;
    return false;
  };

  const confirm = () => {
    const items: StepItem[] = checked.map((key) => {
      if (key === "trigger") return { type: "trigger" as const };
      if (key === "condition") return { type: "condition" as const };
      if (key === "end") return { type: "end" as const };
      return { type: "action" as const, actionType: key.replace("action:", "") as ActionType };
    });
    onAdd(items);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(18,22,42,0.5)" }}>
      <div className="max-h-[82vh] w-full max-w-[620px] overflow-auto rounded-lg bg-white p-6" style={{ border: "1px solid var(--line)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Add nodes
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-[#8B93A7] transition hover:text-[#122043]">
            ✕
          </button>
        </div>

          {inBranch && (
            <p className="mb-4 rounded-xl px-3.5 py-2.5 text-[12px] font-medium" style={{ background: `${EMERALD}0D`, color: "#047857" }}>
              Adding to the {target.branch === "true" ? "YES" : "NO"} branch — actions and the end node only.
            </p>
          )}

          {PICKER_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <div className="mb-2.5 text-[11.5px] font-bold uppercase tracking-wider" style={{ color: "var(--body)" }}>
                {group.label}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item) => {
                  const disabled = disabledKey(item.key);
                  const isChecked = checked.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      disabled={disabled}
                      onClick={() => toggle(item.key)}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        background: isChecked ? `${group.accent}12` : "#F8FAFD",
                        borderColor: isChecked ? group.accent : "var(--line)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        tabIndex={-1}
                        className="h-[15px] w-[15px] shrink-0"
                        style={{ accentColor: group.accent }}
                      />
                      <item.icon size={15} strokeWidth={2.2} style={{ color: group.accent }} />
                      <span>
                        <span className="block text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                          {item.name}
                        </span>
                        <span className="block text-[11px]" style={{ color: "var(--body)" }}>
                          {item.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border px-4 py-2 text-[13px] font-medium transition hover:bg-black/5"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={checked.length === 0}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: checked.length === 0 ? "#B6BDCC" : "#111111" }}
          >
            Add Selected ({checked.length})
          </button>
        </div>
      </div>
    </div>
  );
}
