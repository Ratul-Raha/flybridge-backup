"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Plug, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CrmTabs } from "@/components/dashboard/leads/crm-tabs";
import { fmtDateTime } from "@/components/dashboard/leads/lead-meta";
import type { FieldItem } from "@/components/dashboard/leads/lead-modals";

type Mapping = { source: string; target: string };
type Integration = {
  id: string;
  name: string;
  key: string;
  formId: string;
  fieldMap: Mapping[];
  emailField: string;
  enabled: boolean;
  submissionCount: number;
  lastSubmissionAt: string | null;
  createdAt: string | null;
};

const inputClass =
  "w-full rounded-xl border bg-white px-3.5 py-[9px] text-[13.5px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12px] font-semibold mb-1.5";

const CORE_TARGETS: { value: string; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "source", label: "Source" },
  { value: "priority", label: "Priority" },
];

function appsScriptSnippet(webhookUrl: string): string {
  return `function onFormSubmit(e) {
  var webhookUrl = '${webhookUrl}';

  var response = {};
  var items = e.response.getItemResponses();
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    response[item.getItem().getTitle()] = item.getResponse();
  }

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      formId: e.source.getId(),
      response: response
    })
  });
}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-soft)]"
      style={{ borderColor: "var(--line)", color: copied ? "#0FA968" : "var(--body)" }}
      aria-label="Copy"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function GoogleFormsIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/integrations/google-forms", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load integrations");
      setIntegrations(data.integrations ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/lead-fields", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) setFields(data.fields ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/integrations/google-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create integration");
      setNewName("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create integration");
    } finally {
      setCreating(false);
    }
  };

  const update = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/integrations/google-forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Update failed");
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this integration? Its webhook will stop working.")) return;
    await fetch(`/api/admin/integrations/google-forms/${id}`, { method: "DELETE" });
    await load();
  };

  const targetOptions = [...CORE_TARGETS, ...fields.map((f) => ({ value: f.name, label: f.label }))];

  return (
    <div>
      <PageHeader title="Integrations" subtitle="Connect external sources that create leads." />

      <CrmTabs />

      {error && <p className="mb-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}

      <div className="mb-6 rounded-xl border bg-white p-4 flex flex-wrap items-end gap-3" style={{ borderColor: "var(--line)" }}>
        <div className="min-w-[220px] flex-1">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Google Form name</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Website inquiry form"
            className={inputClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating || !newName.trim()}
          className="inline-flex items-center gap-1.5 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />} Add integration
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" /> Loading integrations…
        </div>
      ) : integrations.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: "var(--line)" }}>
          <Plug size={22} className="mx-auto mb-3" style={{ color: "var(--body)" }} />
          <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>No integrations yet</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
            Add a Google Form to automatically create leads from submissions.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {integrations.map((integration) => {
            const webhookUrl = `${origin}/api/integrations/google-forms/${integration.key}/webhook`;
            return (
              <div key={integration.id} className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--line)" }}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{integration.name}</p>
                      <span
                        className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
                        style={integration.enabled ? { background: "rgba(15,169,104,0.12)", color: "#065F46" } : { background: "var(--line)", color: "var(--body)" }}
                      >
                        {integration.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px]" style={{ color: "var(--body)" }}>
                      {integration.submissionCount} submission{integration.submissionCount === 1 ? "" : "s"}
                      {integration.lastSubmissionAt ? ` · last ${fmtDateTime(integration.lastSubmissionAt)}` : ""}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                    <input
                      type="checkbox"
                      checked={integration.enabled}
                      onChange={(e) => update(integration.id, { enabled: e.target.checked })}
                      className="h-4 w-4"
                      style={{ accentColor: "var(--brand)" }}
                    />
                    Enabled
                  </label>
                  <button type="button" onClick={() => remove(integration.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-red-50" style={{ borderColor: "var(--line)", color: "#C0392B" }} aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className={labelClass} style={{ color: "var(--ink)" }}>Webhook URL</label>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-lg border px-3 py-2 text-[12px]" style={{ borderColor: "var(--line)", color: "var(--body)", background: "var(--bg-soft)" }}>
                        {webhookUrl}
                      </code>
                      <CopyButton text={webhookUrl} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: "var(--ink)" }}>Email question (optional)</label>
                    <input
                      value={integration.emailField}
                      onChange={(e) => update(integration.id, { emailField: e.target.value })}
                      onBlur={(e) => update(integration.id, { emailField: e.target.value })}
                      placeholder="Exact question title that holds the email"
                      className={inputClass}
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>Field mapping</label>
                    <button
                      type="button"
                      onClick={() => update(integration.id, { fieldMap: [...integration.fieldMap, { source: "", target: "" }] })}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ color: "var(--brand)" }}
                    >
                      <Plus size={13} /> Add mapping
                    </button>
                  </div>
                  {integration.fieldMap.length === 0 ? (
                    <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
                      No mappings yet. Map a form question to a lead field (e.g. "What's your name?" → Name).
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {integration.fieldMap.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={m.source}
                            placeholder="Form question title"
                            onChange={(e) => {
                              const next = [...integration.fieldMap];
                              next[i] = { ...next[i], source: e.target.value };
                              update(integration.id, { fieldMap: next });
                            }}
                            className={`${inputClass} flex-1`}
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          />
                          <span style={{ color: "var(--body)" }}>→</span>
                          <select
                            value={m.target}
                            onChange={(e) => {
                              const next = [...integration.fieldMap];
                              next[i] = { ...next[i], target: e.target.value };
                              update(integration.id, { fieldMap: next });
                            }}
                            className={`${inputClass} flex-1`}
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          >
                            <option value="">Choose field…</option>
                            {targetOptions.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const next = integration.fieldMap.filter((_, idx) => idx !== i);
                              update(integration.id, { fieldMap: next });
                            }}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                            style={{ borderColor: "var(--line)", color: "#C0392B" }}
                            aria-label="Remove mapping"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>Apps Script snippet</label>
                    <CopyButton text={appsScriptSnippet(webhookUrl)} />
                  </div>
                  <ol className="mb-2 list-decimal pl-5 text-[12.5px]" style={{ color: "var(--body)" }}>
                    <li>Open your Google Form → ⋮ menu → <strong>Apps Script</strong>.</li>
                    <li>Paste the snippet below and save.</li>
                    <li>In the script, set a trigger: <strong>Form submit</strong> → <strong>onFormSubmit</strong>.</li>
                  </ol>
                  <pre className="overflow-x-auto rounded-lg border p-3 text-[11.5px] leading-relaxed" style={{ borderColor: "var(--line)", color: "var(--body)", background: "var(--bg-soft)" }}>
                    {appsScriptSnippet(webhookUrl)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
