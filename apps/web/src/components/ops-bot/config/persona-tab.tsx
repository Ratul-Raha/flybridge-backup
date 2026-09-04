"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { SectionCard, PrimaryButton, fieldClass, Label } from "@/components/dashboard/automations/ui";

type PersonaConfig = {
  name: string;
  avatar: string;
  greeting: string;
  tone: string;
  detailLevel: string;
  systemPrompt: string;
  maxConversationLength: number;
};

const DEFAULT_CONFIG: PersonaConfig = {
  name: "Bridge Ops",
  avatar: "",
  greeting: "Hi! I'm Bridge Ops, your FlyBridge admin assistant. Ask me anything about your business data or operations.",
  tone: "balanced",
  detailLevel: "balanced",
  systemPrompt: "",
  maxConversationLength: 50,
};

export function PersonaTab() {
  const [config, setConfig] = useState<PersonaConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/bot-config")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SectionCard title="Bot Persona">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" />
          Loading configuration...
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Bot Identity" subtitle="Configure how your bot looks and introduces itself">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Bot Name</Label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className={fieldClass()}
              placeholder="Bridge Ops"
            />
          </div>
          <div>
            <Label>Max Messages Per Session</Label>
            <input
              type="number"
              value={config.maxConversationLength}
              onChange={(e) => setConfig({ ...config, maxConversationLength: Number(e.target.value) })}
              className={fieldClass()}
              min={5}
              max={200}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label>Greeting Message</Label>
          <textarea
            value={config.greeting}
            onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
            className={fieldClass() + " min-h-[80px] resize-y"}
            placeholder="What the bot says when a conversation starts"
          />
        </div>
      </SectionCard>

      <SectionCard title="Personality & Tone" subtitle="Adjust how the bot communicates">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tone</Label>
            <select
              value={config.tone}
              onChange={(e) => setConfig({ ...config, tone: e.target.value })}
              className={fieldClass()}
            >
              <option value="formal">Formal</option>
              <option value="balanced">Balanced</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          <div>
            <Label>Detail Level</Label>
            <select
              value={config.detailLevel}
              onChange={(e) => setConfig({ ...config, detailLevel: e.target.value })}
              className={fieldClass()}
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="System Prompt" subtitle="Advanced: directly edit the base system prompt (leave empty for auto-generated)">
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
          className={fieldClass() + " min-h-[150px] resize-y font-mono text-[12px]"}
          placeholder="Leave empty to use auto-generated prompt based on tone and detail settings above"
        />
      </SectionCard>

      <div className="flex items-center gap-3">
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save Changes"}
        </PrimaryButton>
        {saved && (
          <span className="text-[12px] font-medium" style={{ color: "#059669" }}>
            Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
