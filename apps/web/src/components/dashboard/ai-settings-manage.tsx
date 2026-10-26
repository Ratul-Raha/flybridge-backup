"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  Loader2,
  Mic,
  RefreshCw,
  Save,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

type ProviderId = "groq" | "gemini" | "grok";

type SettingsData = {
  provider: ProviderId;
  source: "dashboard" | "env" | "auto";
  configured: Record<ProviderId, boolean>;
  transcription: {
    provider: "meta";
    model: string;
    configured: boolean;
  };
};

const PROVIDERS: {
  id: ProviderId;
  label: string;
  icon: typeof Zap;
  color: string;
  bg: string;
  blurb: string;
}[] = [
  {
    id: "groq",
    label: "Groq",
    icon: Zap,
    color: "#F55036",
    bg: "rgba(245,80,54,0.12)",
    blurb: "Fast OpenAI-compatible inference",
  },
  {
    id: "gemini",
    label: "Gemini",
    icon: Sparkles,
    color: "#4285F4",
    bg: "rgba(66,133,244,0.12)",
    blurb: "Google — free tier friendly",
  },
  {
    id: "grok",
    label: "Grok",
    icon: Bot,
    color: "#111827",
    bg: "rgba(17,24,39,0.08)",
    blurb: "x.ai (placeholder)",
  },
];

const SOURCE_LABEL: Record<SettingsData["source"], string> = {
  dashboard: "Managed from this dashboard",
  env: "AI_PROVIDER environment variable",
  auto: "Auto-detected from configured keys",
};

function StatusDot({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span
        className="inline-flex h-2 w-2 rounded-full"
        style={{ background: ok ? "#10B981" : "#F59E0B" }}
      />
      <span style={{ color: "var(--ink)" }}>{label}</span>
      {hint && <span style={{ color: "var(--body)" }}>{hint}</span>}
    </div>
  );
}

export function AiSettingsManage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [provider, setProvider] = useState<ProviderId>("groq");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load AI settings");
      const d = (await res.json()) as SettingsData;
      setData(d);
      setProvider(d.provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed to save");
      }
      setSaved(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/ai-settings", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to reset");
      setSaved(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset");
    } finally {
      setSaving(false);
    }
  };

  const changed = !!data && provider !== data.provider;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Provider"
        subtitle="Choose which model provider powers the chat bot, SOP generator, readiness checks, quizzes and IELTS grading."
      />

      {error && (
        <div className="rounded-lg px-4 py-3 text-[13px]" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg px-4 py-3 text-[13px]" style={{ background: "#ECFDF5", color: "#047857" }}>
          Saved — the new provider is active immediately.
        </div>
      )}

      <div className="rounded-lg border bg-white p-6" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>Active provider</h3>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
              {data ? SOURCE_LABEL[data.source] : ""}
            </p>
          </div>
          {data?.source === "dashboard" && (
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-2.5 py-[4px]"
              style={{ background: "rgba(16,185,129,0.12)", color: "#047857" }}
            >
              Dashboard override
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {PROVIDERS.map((p) => {
            const Icon = p.icon;
            const active = provider === p.id;
            const configured = data?.configured?.[p.id] ?? false;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className="rounded-xl border p-4 text-left transition-all"
                style={{
                  borderColor: active ? p.color : "var(--line)",
                  background: active ? p.bg : "transparent",
                  boxShadow: active ? `0 0 0 1px ${p.color}` : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: p.bg, color: p.color }}
                  >
                    <Icon size={17} />
                  </span>
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full border"
                    style={{
                      borderColor: active ? p.color : "var(--line)",
                      background: active ? p.color : "transparent",
                    }}
                  >
                    {active && <Check size={12} style={{ color: "#fff" }} />}
                  </span>
                </div>
                <p className="mt-3 text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {p.label}
                </p>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--body)" }}>
                  {p.blurb}
                </p>
                <div className="mt-3">
                  <StatusDot
                    ok={configured}
                    label={configured ? "API key configured" : "No API key"}
                    hint={configured ? undefined : "missing"}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {data && !data.configured[provider] && (
          <p className="mt-4 flex items-start gap-1.5 text-[12px] font-medium" style={{ color: "#B45309" }}>
            <AlertTriangle size={13} className="mt-[1px] shrink-0" />
            {provider} is selected but no API key is set — requests will fail until the key is added to the
            environment.
          </p>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>Speech to text</h3>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
              Powers IELTS speaking tests and speaking quizzes.
            </p>
          </div>
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-2.5 py-[4px]"
            style={{ background: "rgba(107,76,224,0.1)", color: "var(--brand)" }}
          >
            Transcribe only
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "rgba(107,76,224,0.12)", color: "var(--brand)" }}
              >
                <Mic size={17} />
              </span>
              <StatusDot
                ok={data?.transcription?.configured ?? false}
                label={data?.transcription?.configured ? "API key configured" : "No API key"}
                hint={data?.transcription?.configured ? undefined : "missing"}
              />
            </div>
            <p className="mt-3 text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
              Meta Muse Voice Transcribe
            </p>
            <p className="mt-0.5 font-mono text-[11.5px]" style={{ color: "var(--body)" }}>
              {data?.transcription?.model ?? "muse-voice-transcribe-1.0"}
            </p>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "var(--line)" }}>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: "rgba(15,169,104,0.12)", color: "#0FA968" }}
            >
              <Volume2 size={17} />
            </span>
            <p className="mt-3 text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
              Azure Speech (read aloud)
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--body)" }}>
              Still used for text-to-speech prompts. Not part of transcription.
            </p>
          </div>
        </div>

        {data && !data.transcription?.configured && (
          <p className="mt-4 flex items-start gap-1.5 text-[12px] font-medium" style={{ color: "#B45309" }}>
            <AlertTriangle size={13} className="mt-[1px] shrink-0" />
            META_MODEL_API_KEY is missing — speaking recordings cannot be transcribed until it is added to the
            environment.
          </p>
        )}
        <p className="mt-3 text-[11.5px]" style={{ color: "var(--body)" }}>
          Recordings must be mono 16 kHz or 24 kHz WAV, under 2 minutes per answer (about 4.5 MB upload limit).
          Muse handles transcription only; there is no pronunciation scoring on this path.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !changed}
          className="inline-flex items-center gap-2 rounded-full text-[13.5px] font-semibold text-white px-6 py-2.5 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        {data?.source === "dashboard" && (
          <button
            type="button"
            onClick={() => void reset()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full text-[13px] font-semibold px-4 py-2.5 border transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-50"
            style={{ borderColor: "var(--line)", color: "var(--body)" }}
          >
            Reset to auto
          </button>
        )}
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 rounded-full text-[13px] font-semibold px-4 py-2.5 border transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-50"
          style={{ borderColor: "var(--line)", color: "var(--body)" }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
        {!changed && !saving && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: "var(--body)" }}>
            <Check size={13} style={{ color: "#10B981" }} />
            Up to date
          </span>
        )}
      </div>

      <p className="text-[12px] leading-relaxed max-w-[720px]" style={{ color: "var(--body)", opacity: 0.8 }}>
        The selected provider applies to all AI features. Individual requests can still override it by sending a
        <code className="font-mono">provider</code> field (e.g. <code className="font-mono">{"{ \"provider\": \"groq\" }"}</code>).
        Model names are set separately per provider via <code className="font-mono">GROQ_MODEL</code> and{" "}
        <code className="font-mono">GEMINI_MODEL</code> in the environment.
      </p>
    </div>
  );
}
