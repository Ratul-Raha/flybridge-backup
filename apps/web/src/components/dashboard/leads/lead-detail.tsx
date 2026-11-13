"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  Mail,
  MessageSquarePlus,
  MessageCircle,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CrmTabs } from "@/components/dashboard/leads/crm-tabs";
import { formatMoney } from "@/lib/pricing";
import {
  PRIORITY_META,
  SOURCE_LABEL,
  STATUS_META,
  StatusPill,
  PriorityPill,
  fmtDate,
  fmtDateTime,
} from "@/components/dashboard/leads/lead-meta";
import type { FieldItem } from "@/components/dashboard/leads/lead-modals";

type Detail = {
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    priority: string;
    owner: string | null;
    customFields: Record<string, unknown>;
    interests: { itemType: string; itemId: string; title: string; createdAt: string | null }[];
    tags: string[];
    followUpAt: string | null;
    lastContactedAt: string | null;
    lastActivityAt: string | null;
    convertedAt: string | null;
    createdAt: string;
    attribution: { source: string; medium: string; campaign: string } | null;
  };
  ownerName: string | null;
  orders: { id: string; total: number; currency: string; status: string; title: string; createdAt: string | null }[];
  wishlists: { id: string; title: string; source: string; createdAt: string | null }[];
  registrations: { id: string; title: string; createdAt: string | null }[];
  timeline: { id: string; kind: string; label: string; detail: string; at: string | null }[];
};

const inputClass =
  "w-full rounded-xl border bg-white px-3.5 py-[9px] text-[13.5px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12px] font-semibold mb-1.5";

export function LeadDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load lead");
      setData(json);
      setFollowUp(toDateInput(json.lead.followUpAt));
      setForm({ name: json.lead.name, email: json.lead.email, phone: json.lead.phone });
      setCustomFields(json.lead.customFields ?? {});
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/lead-fields", { cache: "no-store" });
        const json = await res.json();
        if (res.ok) setFields((json.fields ?? []).filter((f: FieldItem) => f.isActive));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const patch = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Update failed");
        await load();
        setNote("");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Update failed");
      } finally {
        setSaving(false);
      }
    },
    [id, load]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
        <Loader2 size={16} className="animate-spin" /> Loading lead…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <BackLink />
        <CrmTabs />
        <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const lead = data.lead;
  const attr = lead.attribution;
  const whatsappHref = lead.phone
    ? `https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div>
      <BackLink />
      <PageHeader
        title={lead.name}
        subtitle={[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact details"}
        action={
          <div className="flex items-center gap-2">
            <StatusPill status={lead.status} />
            <PriorityPill priority={lead.priority} />
          </div>
        }
      />

      <CrmTabs />

      {error && <p className="mb-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Contact + status */}
          <Card title="Lead details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => form.name !== lead.name && patch({ name: form.name })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Email">
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={() => form.email !== lead.email && patch({ email: form.email })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onBlur={() => form.phone !== lead.phone && patch({ phone: form.phone })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </Field>
              <Field label="Status">
                <select
                  value={lead.status}
                  disabled={saving}
                  onChange={(e) => void patch({ status: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  {Object.entries(STATUS_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  value={lead.priority}
                  disabled={saving}
                  onChange={(e) => void patch({ priority: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  {Object.entries(PRIORITY_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Owner">
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-[13.5px]" style={{ color: "var(--ink)" }}>
                    {lead.owner ? data.ownerName ?? "Assigned" : "Unassigned"}
                  </span>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patch({ owner: lead.owner ? null : "me" })}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    {lead.owner ? <UserMinus size={12} /> : <UserPlus size={12} />}
                    {lead.owner ? "Unassign" : "Assign to me"}
                  </button>
                </div>
              </Field>
              <Field label="Follow-up date">
                <input
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </Field>
              <Field label=" ">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void patch({ followUpAt: followUp ? new Date(followUp).toISOString() : null })}
                  className="inline-flex items-center gap-1.5 rounded-full px-5 py-[9px] text-[13px] font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--brand)" }}
                >
                  {saving && <Loader2 size={13} className="animate-spin" />} Save
                </button>
              </Field>
            </div>
          </Card>

          {fields.length > 0 && (
            <Card title="Custom fields">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <Field key={f.id} label={f.label}>
                    <CustomInput
                      field={f}
                      value={customFields[f.name]}
                      onChange={(v) => {
                        const next = { ...customFields, [f.name]: v };
                        setCustomFields(next);
                        void patch({ customFields: next });
                      }}
                    />
                  </Field>
                ))}
              </div>
            </Card>
          )}

          {lead.interests.length > 0 && (
            <Card title="Interested in">
              <div className="flex flex-wrap gap-2">
                {lead.interests.map((interest, i) => (
                  <span key={`${interest.itemId}-${i}`} className="rounded-full px-3 py-1.5 text-[12.5px] font-medium" style={{ background: "var(--bg-soft)", color: "var(--ink)" }}>
                    {interest.title || interest.itemId}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {data.orders.length > 0 && (
            <Card title="Orders">
              <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
                {data.orders.map((order) => (
                  <div key={order.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-[200px] flex-1">
                      <p className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{order.title}</p>
                      <p className="text-[12px]" style={{ color: "var(--body)" }}>{fmtDate(order.createdAt)}</p>
                    </div>
                    <span className="text-[12px] font-medium uppercase" style={{ color: "var(--body)" }}>{order.status}</span>
                    <span className="font-mono text-[13.5px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
                      {formatMoney(order.total, order.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Add a note">
            <div className="flex flex-col gap-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did you talk about? Next steps…"
                rows={3}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
              <div>
                <button
                  type="button"
                  disabled={saving || !note.trim()}
                  onClick={() => void patch({ note: note.trim() })}
                  className="inline-flex items-center gap-1.5 rounded-full px-5 py-[9px] text-[13px] font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--brand)" }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <MessageSquarePlus size={13} />}
                  Add note
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <Card title="Contact">
            <div className="flex flex-col gap-2">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)]" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                  <Mail size={14} /> Email
                </a>
              )}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)]" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              {!lead.email && !whatsappHref && (
                <p className="text-[13px]" style={{ color: "var(--body)" }}>No contact channel available.</p>
              )}
            </div>
          </Card>

          <Card title="Details">
            <div className="flex flex-col gap-2.5 text-[13px]">
              <DetailRow label="Source" value={SOURCE_LABEL[lead.source] ?? lead.source} />
              <DetailRow label="Attribution" value={attr?.source || attr?.campaign ? [attr.source, attr.medium, attr.campaign].filter(Boolean).join(" / ") : "Unattributed"} />
              <DetailRow label="First activity" value={fmtDate(lead.createdAt)} />
              <DetailRow label="Last contacted" value={fmtDate(lead.lastContactedAt)} />
              <DetailRow label="Last activity" value={fmtDateTime(lead.lastActivityAt)} />
            </div>
          </Card>

          <Card title="Activity">
            <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
              {data.timeline.length === 0 ? (
                <p className="py-3 text-[13px]" style={{ color: "var(--body)" }}>No activity yet.</p>
              ) : (
                data.timeline.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3">
                    <CalendarClock size={15} className="mt-0.5 shrink-0" style={{ color: "var(--body)" }} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{item.label}</span>
                        <span className="text-[12px]" style={{ color: "var(--body)" }}>{fmtDateTime(item.at)}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] whitespace-pre-wrap" style={{ color: "var(--body)" }}>{item.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CustomInput({ field, value, onChange }: { field: FieldItem; value: unknown; onChange: (v: unknown) => void }) {
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
    return <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={2} className={inputClass} style={style} />;
  }
  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--ink)" }}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" style={{ accentColor: "var(--brand)" }} />
        Yes
      </label>
    );
  }
  if (field.type === "date") {
    return <input type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} style={style} />;
  }
  if (field.type === "number") {
    return <input type="number" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} style={style} />;
  }
  const inputType = field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  return <input type={inputType} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass} style={style} />;
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function BackLink() {
  return (
    <Link href="/dashboard/admin/crm/leads" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--body)" }}>
      <ArrowLeft size={14} /> All leads
    </Link>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass} style={{ color: "var(--ink)" }}>{label}</label>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <h2 className="mb-4 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{title}</h2>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 font-medium" style={{ color: "var(--ink)" }}>{label}</span>
      <span className="text-right" style={{ color: "var(--body)" }}>{value}</span>
    </div>
  );
}
