"use client";

import { useState } from "react";
import { Zap, GitBranch, Mail, Bell, Webhook, Flag, Plus, X, ChevronDown } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import type { AutomationNode, AutomationEdge, AutomationNodeType, ActionType } from "@/lib/automation/types";
import { EMERALD, AMBER, ACCENT, ROSE } from "./ui";

export const NODE_W = 248;
export const NODE_H = 118;
const LEVEL_GAP = 96;
const COL_GAP = 40;
const PAD = 56;

const TYPE_STYLE: Record<AutomationNodeType, { color: string; bg: string; icon: typeof Zap; label: string }> = {
  trigger: { color: EMERALD, bg: `${EMERALD}14`, icon: Zap, label: "Trigger" },
  condition: { color: AMBER, bg: `${AMBER}16`, icon: GitBranch, label: "Condition" },
  action: { color: ACCENT, bg: `${ACCENT}14`, icon: Mail, label: "Action" },
  end: { color: "#8B93A7", bg: "#8B93A714", icon: Flag, label: "End" },
};

const ACTION_LABEL: Record<ActionType, { label: string; icon: typeof Mail }> = {
  send_email: { label: "Send email", icon: Mail },
  send_notification: { label: "Send notification", icon: Bell },
  webhook: { label: "Webhook", icon: Webhook },
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
};

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
      if (node.data.actionType === "webhook") return node.data.url ? node.data.url : "Add webhook URL";
      if (node.data.actionType === "send_email") {
        const to =
          node.data.to?.mode === "fixed"
            ? node.data.to.value.split(/[,\n]/)[0]
            : node.data.to?.mode === "role"
              ? "all users"
              : node.data.to?.value || "recipient";
        return `${node.data.subject || "Email"} → ${to}`.slice(0, 60);
      }
      return node.data.title || "Notification message";
    }
    case "end":
      return "Flow ends here";
  }
}

type Layout = Map<string, { x: number; y: number }>;

function layoutGraph(nodes: AutomationNode[], edges: AutomationEdge[]): Layout {
  const levels = new Map<string, number>();
  const order: string[] = [];
  const trigger = nodes.find((n) => n.type === "trigger");

  if (trigger) {
    levels.set(trigger.id, 0);
    order.push(trigger.id);
  }

  const queue = trigger ? [trigger.id] : [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const lvl = levels.get(id) ?? 0;
    const out = edges
      .filter((e) => e.source === id)
      .sort((a, b) => {
        const ha = a.sourceHandle === "true" ? 0 : 1;
        const hb = b.sourceHandle === "true" ? 0 : 1;
        return ha - hb;
      });
    for (const e of out) {
      const existing = levels.get(e.target);
      if (existing === undefined) {
        levels.set(e.target, lvl + 1);
        order.push(e.target);
        queue.push(e.target);
      } else if (existing < lvl + 1) {
        levels.set(e.target, lvl + 1);
      }
    }
  }
  for (const n of nodes) {
    if (!levels.has(n.id)) {
      levels.set(n.id, 1);
      order.push(n.id);
    }
  }

  const grouped = new Map<number, string[]>();
  for (const id of order) {
    const lvl = levels.get(id) ?? 0;
    if (!grouped.has(lvl)) grouped.set(lvl, []);
    grouped.get(lvl)!.push(id);
  }

  const positions: Layout = new Map();
  let maxLevel = 0;
  for (const [lvl, ids] of grouped) {
    maxLevel = Math.max(maxLevel, lvl);
    ids.forEach((id, idx) => {
      positions.set(id, {
        x: PAD + idx * (NODE_W + COL_GAP),
        y: PAD + lvl * (NODE_H + LEVEL_GAP),
      });
    });
  }
  return positions;
}

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }, xOffset: number) {
  const x1 = from.x + NODE_W / 2 + xOffset;
  const y1 = from.y + NODE_H;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y;
  const midY = (y1 + y2) / 2;
  return {
    d: `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`,
    label: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
  };
}

const ADD_OPTIONS: { type: AutomationNodeType; label: string }[] = [
  { type: "condition", label: "Condition (yes / no)" },
  { type: "action", label: "Email" },
  { type: "action", label: "Notification" },
  { type: "action", label: "Webhook" },
  { type: "end", label: "End" },
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
  onAdd: (source: AutomationNode, branch: "true" | "false" | null, type: AutomationNodeType) => void;
  onDelete: (node: AutomationNode) => void;
}) {
  const [menu, setMenu] = useState<{ nodeId: string; branch: "true" | "false" | null } | null>(null);

  const positions = layoutGraph(nodes, edges);
  let maxLevel = 0;
  const rowsByLevel = new Map<number, number>();
  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const level = Math.round((pos.y - PAD) / (NODE_H + LEVEL_GAP));
    maxLevel = Math.max(maxLevel, level);
    rowsByLevel.set(level, (rowsByLevel.get(level) ?? 0) + 1);
  }
  let maxRows = 0;
  for (const rows of rowsByLevel.values()) maxRows = Math.max(maxRows, rows);

  const width = PAD * 2 + maxRows * (NODE_W + COL_GAP) + NODE_W;
  const height = PAD * 2 + maxLevel * (NODE_H + LEVEL_GAP) + NODE_H;

  return (
    <div
      className="overflow-auto rounded-[22px] border bg-[#F8FAFD]"
      style={{ borderColor: "var(--line)", maxHeight: "62vh" }}
      onClick={() => setMenu(null)}
    >
      <div className="relative" style={{ width, height }}>
        <svg className="absolute inset-0" width={width} height={height} style={{ pointerEvents: "none" }}>
          {edges.map((edge) => {
            const from = positions.get(edge.source);
            const to = positions.get(edge.target);
            if (!from || !to) return null;
            const xOffset = edge.sourceHandle === "true" ? 14 : edge.sourceHandle === "false" ? -14 : 0;
            const path = edgePath(from, to, xOffset);
            const color = edge.sourceHandle === "true" ? EMERALD : edge.sourceHandle === "false" ? "#F43F5E" : "#A6ADC0";
            return (
              <g key={edge.id}>
                <path d={path.d} fill="none" stroke={color} strokeWidth={edge.sourceHandle ? 2.2 : 1.8} strokeDasharray={edge.sourceHandle ? "none" : "6 5"} />
                {edge.sourceHandle && (
                  <g>
                    <rect x={path.label.x - 15} y={path.label.y - 10} width={30} height={20} rx={10} fill="#fff" stroke={color} strokeWidth={1} />
                    <text x={path.label.x} y={path.label.y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={color}>
                      {edge.sourceHandle === "true" ? "YES" : "NO"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const style = TYPE_STYLE[node.type];
          const Icon = style.icon;
          const actionMeta = node.type === "action" ? ACTION_LABEL[node.data.actionType ?? "send_email"] : null;
          const isSelected = selectedId === node.id;
          return (
            <div
              key={node.id}
              className="absolute rounded-2xl border bg-white transition"
              style={{
                left: pos.x,
                top: pos.y,
                width: NODE_W,
                minHeight: NODE_H,
                borderColor: isSelected ? style.color : "var(--line)",
                boxShadow: isSelected
                  ? `0 0 0 3px ${style.color}26, 0 10px 24px -12px rgba(18,22,42,0.18)`
                  : "0 1px 2px rgba(16,24,40,0.06)",
              }}
              onClick={() => onSelect(node)}
            >
              <div className="flex items-center gap-2 px-3.5 pt-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: style.bg, color: style.color }}>
                  {node.type === "action" && actionMeta ? <actionMeta.icon size={13} strokeWidth={2.4} /> : <Icon size={13} strokeWidth={2.4} />}
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: style.color }}>
                  {node.type === "action" && actionMeta ? actionMeta.label : style.label}
                </span>
                <button
                  className="ml-auto rounded-full p-1 text-[#B6BDCC] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node);
                  }}
                  aria-label="Delete step"
                >
                  <X size={13} />
                </button>
              </div>

              <p className="px-3.5 pt-1.5 text-[12.5px] font-medium leading-snug break-words" style={{ color: "var(--ink)" }}>
                {summaryOf(node)}
              </p>

              <div className="flex items-center justify-between px-3 pb-3 pt-2.5">
                {node.type === "condition" ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      className="rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition hover:bg-black/5"
                      style={{ borderColor: `${EMERALD}55`, color: EMERALD }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenu({ nodeId: node.id, branch: "true" });
                      }}
                    >
                      YES +
                    </button>
                    <button
                      className="rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition hover:bg-black/5"
                      style={{ borderColor: `${ROSE}55`, color: ROSE }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenu({ nodeId: node.id, branch: "false" });
                      }}
                    >
                      NO +
                    </button>
                  </div>
                ) : node.type !== "end" ? (
                  <button
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition hover:bg-black/5"
                    style={{ borderColor: "var(--line)", color: "var(--body)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenu({ nodeId: node.id, branch: null });
                    }}
                  >
                    <Plus size={11} strokeWidth={3} /> Add step <ChevronDown size={11} />
                  </button>
                ) : (
                  <span />
                )}

                {menu?.nodeId === node.id && (
                  <div
                    className="absolute right-3 bottom-10 z-20 w-44 overflow-hidden rounded-xl border bg-white shadow-lg"
                    style={{ borderColor: "var(--line)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {ADD_OPTIONS.map((opt) => (
                      <button
                        key={`${opt.type}-${opt.label}`}
                        className="block w-full px-3 py-2 text-left text-[12px] font-medium transition hover:bg-black/5"
                        style={{ color: "var(--ink)" }}
                        onClick={() => {
                          onAdd(node, menu.branch, opt.type);
                          setMenu(null);
                        }}
                      >
                        {opt.label}
                        {opt.type === "condition" && <span className="ml-1 text-[10px]" style={{ color: AMBER }}>(yes/no)</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
