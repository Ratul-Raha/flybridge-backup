"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Database,
  Wrench,
  MessageSquare,
  Shield,
  ScrollText,
  Bot,
  Eye,
  Zap,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { SectionCard, StatusPill } from "@/components/dashboard/automations/ui";

type Feature = {
  name: string;
  description: string;
  icon: string;
};

type Param = {
  name: string;
  type: string;
  description: string;
  enum?: string[];
  required: boolean;
};

type Tool = {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  category: string;
  destructive: boolean;
  parameters: Param[];
};

type CapabilitiesData = {
  features: Feature[];
  tools: Tool[];
  summary: { total: number; data: number; action: number; enabled: number };
};

const FEATURE_ICONS: Record<string, typeof Database> = {
  database: Database,
  wrench: Wrench,
  message: MessageSquare,
  shield: Shield,
  scroll: ScrollText,
  bot: Bot,
};

export function CapabilitiesTab() {
  const [data, setData] = useState<CapabilitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "data" | "action">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/bot-config/capabilities")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading || !data) {
    return (
      <SectionCard title="Capabilities">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" />
          Loading capabilities...
        </div>
      </SectionCard>
    );
  }

  const filtered = data.tools.filter((t) => filter === "all" || t.category === filter);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total Tools", value: data.summary.total, color: "var(--ink)" },
          { label: "Read-Only", value: data.summary.data, color: "#0EA5E9" },
          { label: "Actions", value: data.summary.action, color: "#F59E0B" },
          { label: "Enabled", value: data.summary.enabled, color: "#10B981" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
            style={{ borderColor: "var(--line)", background: "#fff" }}
          >
            <span className="text-[20px] font-bold font-display" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Features */}
      <SectionCard title="Core Features" subtitle="What Bridge Ops can do out of the box">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.features.map((f) => {
            const Icon = FEATURE_ICONS[f.icon] ?? Wrench;
            return (
              <div
                key={f.name}
                className="flex flex-col gap-2 rounded-xl border p-4"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    <Icon size={16} style={{ color: "var(--brand)" }} />
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    {f.name}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--body)" }}>
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Tools */}
      <SectionCard
        title="Tool Reference"
        subtitle="Every tool the bot can call, with parameters and usage details"
      >
        <div className="flex gap-2 mb-4">
          {(["all", "data", "action"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition"
              style={{
                background: filter === f ? "var(--brand)" : "var(--bg-soft)",
                color: filter === f ? "#fff" : "var(--body)",
              }}
            >
              {f === "all" ? `All (${data.tools.length})` : f === "data" ? `Read-Only (${data.summary.data})` : `Actions (${data.summary.action})`}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((tool) => {
            const isExpanded = expanded.has(tool.name);
            return (
              <div
                key={tool.name}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--line)" }}
              >
                {/* Tool header */}
                <button
                  type="button"
                  onClick={() => toggle(tool.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-black/[0.02]"
                >
                  {isExpanded ? (
                    <ChevronDown size={14} style={{ color: "var(--body)" }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: "var(--body)" }} />
                  )}
                  {tool.category === "data" ? (
                    <Eye size={14} style={{ color: "#0EA5E9" }} />
                  ) : tool.destructive ? (
                    <Trash2 size={14} style={{ color: "#DC2626" }} />
                  ) : (
                    <Zap size={14} style={{ color: "#F59E0B" }} />
                  )}
                  <span className="flex-1 text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    {tool.displayName}
                  </span>
                  <StatusPill
                    label={tool.category}
                    color={tool.category === "data" ? "#0EA5E9" : "#F59E0B"}
                  />
                  {tool.destructive && <StatusPill label="destructive" color="#DC2626" />}
                  {tool.enabled ? (
                    <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                  ) : (
                    <XCircle size={14} style={{ color: "#D1D5DB" }} />
                  )}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4 pt-1 border-t"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <p className="text-[12.5px] mb-3" style={{ color: "var(--body)" }}>
                      {tool.description}
                    </p>

                    {tool.parameters.length > 0 && (
                      <div>
                        <span
                          className="block text-[11px] font-semibold uppercase tracking-wide mb-2"
                          style={{ color: "var(--body)" }}
                        >
                          Parameters
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {tool.parameters.map((p) => (
                            <div
                              key={p.name}
                              className="flex items-start gap-3 rounded-lg px-3 py-2"
                              style={{ background: "var(--bg-soft)" }}
                            >
                              <code
                                className="text-[12px] font-mono shrink-0 mt-px"
                                style={{ color: "var(--brand)" }}
                              >
                                {p.name}
                              </code>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-[11px] font-mono"
                                    style={{ color: "var(--body)" }}
                                  >
                                    {p.type}
                                  </span>
                                  {p.required && (
                                    <span className="text-[10px] font-semibold" style={{ color: "#DC2626" }}>
                                      required
                                    </span>
                                  )}
                                  {p.enum && (
                                    <span className="text-[10px] font-mono" style={{ color: "var(--body)" }}>
                                      [{p.enum.join(", ")}]
                                    </span>
                                  )}
                                </div>
                                {p.description && (
                                  <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
                                    {p.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tool.parameters.length === 0 && (
                      <span className="text-[11px] italic" style={{ color: "var(--body)" }}>
                        No parameters — runs instantly
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
