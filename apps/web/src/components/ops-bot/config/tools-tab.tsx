"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Wrench, Eye, Zap, Trash2 } from "lucide-react";
import { SectionCard, PrimaryButton, Label, StatusPill, fieldClass } from "@/components/dashboard/automations/ui";

type Tool = {
  id: string;
  toolId: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  confirmationRequired: string;
  accessLevel: string;
  customInstructions: string;
  isDestructive: boolean;
};

export function ToolsTab() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState<"all" | "data" | "action">("all");

  useEffect(() => {
    fetch("/api/admin/bot-config/tools")
      .then((r) => r.json())
      .then((data) => {
        setTools(data.tools);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateTool = (toolId: string, changes: Partial<Tool>) => {
    setTools((prev) =>
      prev.map((t) => (t.toolId === toolId ? { ...t, ...changes } : t))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/bot-config/tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: tools.map((t) => ({
            toolId: t.toolId,
            changes: {
              name: t.name,
              enabled: t.enabled,
              confirmationRequired: t.confirmationRequired,
              accessLevel: t.accessLevel,
              customInstructions: t.customInstructions,
            },
          })),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const filtered = tools.filter((t) => filter === "all" || t.category === filter);

  if (loading) {
    return (
      <SectionCard title="Tool Configuration">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" />
          Loading tools...
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Available Tools"
        subtitle="Configure which tools the bot can use and how they behave"
        action={
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving..." : "Save"}
          </PrimaryButton>
        }
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
              {f === "all" ? "All" : f === "data" ? "Read Only" : "Actions"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {filtered.map((tool) => (
            <div
              key={tool.toolId}
              className="flex items-start gap-4 p-4 rounded-xl border"
              style={{
                borderColor: "var(--line)",
                opacity: tool.enabled ? 1 : 0.6,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {tool.category === "data" ? (
                    <Eye size={14} style={{ color: "#0EA5E9" }} />
                  ) : tool.isDestructive ? (
                    <Trash2 size={14} style={{ color: "#DC2626" }} />
                  ) : (
                    <Zap size={14} style={{ color: "#F59E0B" }} />
                  )}
                  <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    {tool.name}
                  </span>
                  <StatusPill
                    label={tool.category}
                    color={tool.category === "data" ? "#0EA5E9" : "#F59E0B"}
                  />
                  {tool.isDestructive && (
                    <StatusPill label="destructive" color="#DC2626" />
                  )}
                </div>
                <p className="text-[12px] mb-2" style={{ color: "var(--body)" }}>
                  {tool.description.slice(0, 120)}
                  {tool.description.length > 120 ? "..." : ""}
                </p>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--body)" }}>
                    <input
                      type="checkbox"
                      checked={tool.enabled}
                      onChange={(e) => updateTool(tool.toolId, { enabled: e.target.checked })}
                      className="rounded"
                    />
                    Enabled
                  </label>
                  <div>
                    <select
                      value={tool.confirmationRequired}
                      onChange={(e) => updateTool(tool.toolId, { confirmationRequired: e.target.value })}
                      className="text-[11px] rounded-lg border px-2 py-1"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      <option value="never">No confirmation</option>
                      <option value="always">Always confirm</option>
                      <option value="destructive">Destructive only</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={tool.accessLevel}
                      onChange={(e) => updateTool(tool.toolId, { accessLevel: e.target.value })}
                      className="text-[11px] rounded-lg border px-2 py-1"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      <option value="admin">Admin only</option>
                      <option value="moderator">Admin + Moderator</option>
                      <option value="all">All users</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {saved && (
          <div className="mt-3 text-[12px] font-medium" style={{ color: "#059669" }}>
            Tools saved successfully
          </div>
        )}
      </SectionCard>
    </div>
  );
}
