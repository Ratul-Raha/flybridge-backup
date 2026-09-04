"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { SectionCard, PrimaryButton, GhostButton, Modal, fieldClass, Label, StatusPill } from "@/components/dashboard/automations/ui";

type Rule = {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#DC2626",
  medium: "#F59E0B",
  low: "#0EA5E9",
};

const CATEGORY_LABELS: Record<string, string> = {
  customer_service: "Customer Service",
  pricing: "Pricing",
  content: "Content",
  operations: "Operations",
};

export function RulesTab() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ title: "", content: "", category: "operations", priority: "medium" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bot-config/rules")
      .then((r) => r.json())
      .then((data) => {
        setRules(data.rules);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newRule.title || !newRule.content) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/bot-config/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule),
      });
      const data = await res.json();
      setRules((prev) => [data.rule, ...prev]);
      setNewRule({ title: "", content: "", category: "operations", priority: "medium" });
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (rule: Rule) => {
    const newStatus = rule.status === "active" ? "disabled" : "active";
    await fetch(`/api/admin/bot-config/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, status: newStatus } : r))
    );
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/admin/bot-config/rules/${ruleId}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  if (loading) {
    return (
      <SectionCard title="Rules & Policies">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" />
          Loading rules...
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Rules & Policies"
        subtitle="Define rules the bot follows when responding to admin queries"
        action={
          <PrimaryButton onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            Add Rule
          </PrimaryButton>
        }
      >
        {rules.length === 0 ? (
          <p className="text-[13px] py-4 text-center" style={{ color: "var(--body)" }}>
            No rules yet. Add rules to control how the bot behaves.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                      {rule.title}
                    </span>
                    <StatusPill
                      label={rule.category}
                      color="#6E4CFF"
                    />
                    <StatusPill
                      label={rule.priority}
                      color={PRIORITY_COLORS[rule.priority] ?? "#6E4CFF"}
                    />
                    <StatusPill
                      label={rule.status}
                      color={rule.status === "active" ? "#059669" : "#A6ADC0"}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <GhostButton
                      onClick={() => handleToggleStatus(rule)}
                      tone={rule.status === "active" ? "#F59E0B" : "#059669"}
                    >
                      {rule.status === "active" ? "Disable" : "Enable"}
                    </GhostButton>
                    <GhostButton onClick={() => handleDelete(rule.id)} tone="#DC2626">
                      <Trash2 size={13} />
                    </GhostButton>
                  </div>
                </div>
                <p className="text-[12.5px] whitespace-pre-wrap" style={{ color: "var(--body)" }}>
                  {rule.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Rule">
        <div className="flex flex-col gap-4">
          <div>
            <Label>Title</Label>
            <input
              type="text"
              value={newRule.title}
              onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
              className={fieldClass()}
              placeholder="e.g., Refund Policy"
            />
          </div>
          <div>
            <Label>Content</Label>
            <textarea
              value={newRule.content}
              onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
              className={fieldClass() + " min-h-[120px] resize-y"}
              placeholder="The rule text the bot should follow..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <select
                value={newRule.category}
                onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                className={fieldClass()}
              >
                <option value="customer_service">Customer Service</option>
                <option value="pricing">Pricing</option>
                <option value="content">Content</option>
                <option value="operations">Operations</option>
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
                className={fieldClass()}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <GhostButton onClick={() => setShowCreate(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={handleCreate} disabled={creating || !newRule.title || !newRule.content}>
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Rule
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
