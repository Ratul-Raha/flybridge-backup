"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { parseCsv } from "@/lib/csv";
import { PRIORITY_META, SOURCE_LABEL } from "@/components/dashboard/leads/lead-meta";

export type FieldOption = { value: string; label: string };
export type FieldItem = {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  options: FieldOption[];
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
};
export type ListItem = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  leadCount: number;
};
export type LeadItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority: string;
  owner: string | null;
  list: string | null;
  customFields: Record<string, unknown>;
  interests: { itemType: string; itemId: string; title: string; createdAt: string | null }[];
  tags: string[];
  followUpAt: string | null;
  lastContactedAt: string | null;
  lastActivityAt: string | null;
  convertedAt: string | null;
  createdAt: string;
  customer: boolean;
};

const inputClass =
  "w-full rounded-xl border bg-white px-3.5 py-[9px] text-[13.5px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12px] font-semibold mb-1.5";

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxW = "max-w-xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(15,17,28,0.5)", backdropFilter: "blur(2px)" }} />
      <div
        className={`relative w-full ${maxW} max-h-[88vh] flex flex-col overflow-hidden rounded-lg border bg-white shadow-2xl`}
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--line)" }}>
          <div>
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{title}</p>
            {subtitle && <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[#F1F0F8]"
            style={{ borderColor: "var(--line)", color: "var(--body)" }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldItem;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const style = { borderColor: "var(--line)", color: "var(--ink)" };
  if (field.type === "select") {
    return (
      <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} style={style}>
        <option value="">—</option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={field.placeholder}
        className={inputClass}
        style={style}
      />
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--ink)" }}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
          style={{ accentColor: "var(--brand)" }}
        />
        Yes
      </label>
    );
  }
  if (field.type === "date") {
    return (
      <input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        style={style}
      />
    );
  }
  if (field.type === "number") {
    return (
      <input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={inputClass}
        style={style}
      />
    );
  }
  const inputType = field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  return (
    <input
      type={inputType}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || `Enter ${field.label}`}
      className={inputClass}
      style={style}
    />
  );
}

export function LeadFormModal({
  mode,
  lead,
  lists,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  lead: LeadItem | null;
  lists: ListItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("manual");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("new");
  const [listId, setListId] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [availableFields, setAvailableFields] = useState<FieldItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && lead) {
      setName(lead.name);
      setEmail(lead.email);
      setPhone(lead.phone);
      setSource(lead.source);
      setPriority(lead.priority);
      setStatus(lead.status);
      setListId(lead.list ?? "");
      setCustomFields(lead.customFields ?? {});
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setSource("manual");
      setPriority("medium");
      setStatus("new");
      setListId(lists.find((l) => l.isDefault)?.id ?? lists[0]?.id ?? "");
      setCustomFields({});
    }
  }, [mode, lead, lists]);

  const fieldsListId = mode === "edit" ? lead?.list ?? "" : listId;

  useEffect(() => {
    if (!fieldsListId) {
      setAvailableFields([]);
      return;
    }
    let active = true;
    fetch(`/api/admin/lead-fields?listId=${encodeURIComponent(fieldsListId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setAvailableFields(((data?.fields ?? []) as FieldItem[]).filter((f) => f.isActive));
      })
      .catch(() => {
        if (active) setAvailableFields([]);
      });
    return () => {
      active = false;
    };
  }, [fieldsListId]);

  const save = async () => {
    if (!name.trim()) {
      setError("A name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name,
        email,
        phone,
        source,
        priority,
        customFields,
      };
      const url = mode === "edit" && lead ? `/api/admin/leads/${lead.id}` : "/api/admin/leads";
      const method = mode === "edit" && lead ? "PATCH" : "POST";
      if (mode === "create") payload.listId = listId || undefined;
      else payload.status = status;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={mode === "edit" ? "Edit lead" : "Add lead"}
      subtitle={mode === "edit" ? lead?.name : "Create a new lead manually"}
      onClose={onClose}
      maxW="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {error && <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }}>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="person@example.com" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880…" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }}>Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              {Object.entries(SOURCE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              {Object.entries(PRIORITY_META).map(([v, m]) => (
                <option key={v} value={v}>{m.label}</option>
              ))}
            </select>
          </div>
          {mode === "create" ? (
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>List</label>
              <select value={listId} onChange={(e) => setListId(e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                {Object.entries(STATUS_OPTIONS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {availableFields.length > 0 && (
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Custom fields</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {availableFields.map((f) => (
                <div key={f.id}>
                  <label className={labelClass} style={{ color: "var(--ink)" }}>
                    {f.label} {f.isRequired && <span style={{ color: "#C0392B" }}>*</span>}
                  </label>
                  <FieldInput field={f} value={customFields[f.name]} onChange={(v) => setCustomFields((prev) => ({ ...prev, [f.name]: v }))} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {mode === "edit" ? "Update lead" : "Create lead"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border px-6 py-[10px] text-[13.5px] font-medium" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

const STATUS_OPTIONS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  "follow-up": "Follow-up",
  converted: "Converted",
  "not-interested": "Not interested",
  unqualified: "Unqualified",
};

export function ImportModal({ lists, onClose, onImported }: { lists: ListItem[]; onClose: () => void; onImported: () => void }) {
  const [listId, setListId] = useState("");
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setListId(lists.find((l) => l.isDefault)?.id ?? lists[0]?.id ?? "");
  }, [lists]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRawText(text);
      const parsed = parseCsv(text);
      if (!parsed) {
        setError("No valid rows found in that file");
        setRows(null);
        setHeaders([]);
        return;
      }
      setError(null);
      setResult(null);
      setRows(parsed);
      setHeaders(Object.keys(parsed[0] ?? {}));
    };
    reader.readAsText(file);
  };

  const importCsv = async () => {
    if (!rows) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: rawText, listId: listId || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Import leads from CSV" subtitle="Column headers map to lead fields" onClose={onClose} maxW="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--ink)" }}>Import into list</label>
          <select value={listId} onChange={(e) => setListId(e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <label
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors hover:bg-[var(--bg-soft)]"
          style={{ borderColor: "var(--line)" }}
        >
          <Upload size={22} style={{ color: "var(--body)" }} />
          <span className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>Drop CSV here or click to browse</span>
          <span className="text-[12px]" style={{ color: "var(--body)" }}>Expected columns: name, email, phone, source, priority + custom fields</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </label>

        {error && <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}

        {rows && (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--line)" }}>
            <div className="max-h-48 overflow-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead className="sticky top-0" style={{ background: "var(--bg-soft)" }}>
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold uppercase tracking-wide" style={{ color: "var(--body)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2" style={{ color: "var(--ink)" }}>{r[h] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-3 py-2 text-[12px]" style={{ color: "var(--body)", borderTop: "1px solid var(--line)" }}>
              {rows.length} row{rows.length === 1 ? "" : "s"} detected
            </p>
          </div>
        )}

        {result && (
          <p className="rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: "rgba(15,169,104,0.08)", color: "#065F46" }}>
            Imported {result.created} lead{result.created === 1 ? "" : "s"}. {result.skipped} skipped (duplicate/empty).
          </p>
        )}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={importCsv}
          disabled={busy || !rows}
          className="inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          Import {rows?.length ?? 0} leads
        </button>
        <button type="button" onClick={onClose} className="rounded-full border px-6 py-[10px] text-[13.5px] font-medium" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

export function FieldsModal({
  lists,
  defaultListId,
  onClose,
  onChanged,
}: {
  lists: ListItem[];
  defaultListId?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [listId, setListId] = useState(
    defaultListId || lists.find((l) => l.isDefault)?.id || lists[0]?.id || ""
  );
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", label: "", type: "text", options: "", isRequired: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!listId) {
      setFields([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lead-fields?listId=${encodeURIComponent(listId)}`, { cache: "no-store" });
      const data = await res.json();
      setFields(data.fields ?? []);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createField = async () => {
    if (!listId) {
      setError("Select a list first");
      return;
    }
    if (!form.name.trim() || !form.label.trim()) {
      setError("Name and label are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const options = form.type === "select"
        ? form.options.split(",").map((s) => s.trim()).filter(Boolean).map((v) => ({ value: v, label: v }))
        : [];
      const res = await fetch("/api/admin/lead-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId,
          name: form.name,
          label: form.label,
          type: form.type,
          options,
          isRequired: form.isRequired,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create field");
      setForm({ name: "", label: "", type: "text", options: "", isRequired: false });
      setAdding(false);
      await load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create field");
    } finally {
      setBusy(false);
    }
  };

  const toggleField = async (f: FieldItem) => {
    await fetch(`/api/admin/lead-fields/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !f.isActive }),
    });
    await load();
    onChanged();
  };

  const deleteField = async (f: FieldItem) => {
    if (!window.confirm(`Delete the field "${f.label}"?`)) return;
    await fetch(`/api/admin/lead-fields/${f.id}`, { method: "DELETE" });
    await load();
    onChanged();
  };

  return (
    <ModalShell title="Manage custom fields" subtitle="Each list has its own fields for its form and leads" onClose={onClose} maxW="max-w-xl">
      <div className="flex flex-col gap-4">
        {error && <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}

        {lists.length === 0 ? (
          <p className="rounded-xl border px-4 py-5 text-[13px]" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
            Create a lead list first. Fields belong to a specific list.
          </p>
        ) : (
          <>
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>List</label>
              <select
                value={listId}
                onChange={(e) => {
                  setListId(e.target.value);
                  setAdding(false);
                  setError(null);
                }}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div
              className="rounded-xl border px-4 py-3 text-[12.5px] leading-[1.6]"
              style={{ borderColor: "var(--line)", background: "var(--bg-soft)", color: "var(--body)" }}
            >
              Name, email and phone are built-in fields. Everything you add here is custom for
              <span className="font-semibold" style={{ color: "var(--ink)" }}>
                {" "}{lists.find((l) => l.id === listId)?.name ?? "this list"}
              </span>
              .
            </div>

            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 self-start rounded-full px-5 py-[9px] text-[13px] font-medium text-white"
                style={{ background: "var(--brand)" }}
              >
                <Plus size={14} /> Add field
              </button>
            ) : (
              <div className="rounded-lg border p-4 flex flex-col gap-3" style={{ borderColor: "var(--line)" }}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} style={{ color: "var(--ink)" }}>Field name (id)</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. preferred_destination" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: "var(--ink)" }}>Label</label>
                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Preferred Destination" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ color: "var(--ink)" }}>Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  {form.type === "select" && (
                    <div>
                      <label className={labelClass} style={{ color: "var(--ink)" }}>Options (comma separated)</label>
                      <input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="UK, USA, Canada" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
                    </div>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--ink)" }}>
                  <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} className="h-4 w-4" style={{ accentColor: "var(--brand)" }} />
                  Required field
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={createField} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full px-5 py-[8px] text-[12.5px] font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
                    {busy && <Loader2 size={13} className="animate-spin" />} Create
                  </button>
                  <button type="button" onClick={() => setAdding(false)} className="rounded-full border px-5 py-[8px] text-[12.5px] font-medium" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col divide-y rounded-xl border overflow-hidden" style={{ borderColor: "var(--line)" }}>
              {loading ? (
                <div className="flex items-center gap-2 px-4 py-6 text-[13px]" style={{ color: "var(--body)" }}>
                  <Loader2 size={15} className="animate-spin" /> Loading…
                </div>
              ) : fields.length === 0 ? (
                <p className="px-4 py-6 text-[13px]" style={{ color: "var(--body)" }}>
                  No custom fields for this list yet. Add one to capture extra info.
                </p>
              ) : (
                fields.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{f.label}</p>
                      <p className="text-[12px]" style={{ color: "var(--body)" }}>{f.name} · {f.type}</p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
                      style={f.isActive ? { background: "rgba(15,169,104,0.12)", color: "#065F46" } : { background: "var(--line)", color: "var(--body)" }}
                    >
                      {f.isActive ? "Visible" : "Hidden"}
                    </span>
                    <button type="button" onClick={() => toggleField(f)} className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>
                      {f.isActive ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => deleteField(f)} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-red-50" style={{ borderColor: "var(--line)", color: "#C0392B" }} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

export function CreateListModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    if (!name.trim()) {
      setError("A list name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/lead-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create list");
      setCreated({ id: data.list?.id ?? "", slug: data.list?.formSlug ?? "" });
      onCreated(data.list?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create list");
    } finally {
      setBusy(false);
    }
  };

  const formUrl =
    created?.slug && typeof window !== "undefined"
      ? `${window.location.origin}/forms/${created.slug}`
      : "";

  const copyUrl = async () => {
    if (!formUrl) return;
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (created) {
    return (
      <ModalShell title="List created" subtitle="A public form was created automatically" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl border px-4 py-3.5"
            style={{ borderColor: "rgba(15,169,104,0.25)", background: "rgba(15,169,104,0.06)" }}
          >
            <p className="text-[13px] font-semibold" style={{ color: "#065F46" }}>
              Form ready to share
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
              Leads submitted through this link will land in this list. There is no public menu
              link — share the URL directly.
            </p>
          </div>

          {formUrl ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={formUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border bg-[var(--bg-soft)] px-3.5 py-[9px] font-mono text-[12px] outline-none"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                aria-label="Public form URL"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-soft)]"
                style={{ borderColor: "var(--line)", color: copied ? "#0FA968" : "var(--body)" }}
                aria-label="Copy form URL"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
              <a
                href={formUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-soft)]"
                style={{ borderColor: "var(--line)", color: "var(--body)" }}
                aria-label="Open form"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          ) : (
            <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
              Open the Forms tab to copy this list&apos;s form URL.
            </p>
          )}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={onClose} className="rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white" style={{ background: "var(--brand)" }}>
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Create lead list" subtitle="Lists group related leads" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error && <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}
        <div>
          <label className={labelClass} style={{ color: "var(--ink)" }}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IELTS Leads" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--ink)" }}>Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <p className="text-[12px] leading-[1.6]" style={{ color: "var(--body)" }}>
          A public form will be created automatically for this list.
        </p>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={create} disabled={busy} className="inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
          {busy && <Loader2 size={14} className="animate-spin" />} Create list
        </button>
        <button type="button" onClick={onClose} className="rounded-full border px-6 py-[10px] text-[13.5px] font-medium" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}
