"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Loader2, MessageSquarePlus, UserPlus, UserMinus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatMoney } from "@/lib/pricing";
import { SOURCE_LABEL, STATUS_META, StatusPill, fmtDate } from "@/components/dashboard/leads/lead-meta";

type Detail = {
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    owner: string | null;
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
  "w-full rounded-xl border bg-white px-4 py-[10px] text-[14px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12.5px] font-medium";

export function LeadDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load lead");
      setData(json);
      setFollowUp(toDateInput(json.lead.followUpAt));
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
        <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const lead = data.lead;
  const attr = lead.attribution;

  return (
    <div>
      <BackLink />
      <PageHeader
        title={lead.name}
        subtitle={[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact details"}
        action={<StatusPill status={lead.status} />}
      />

      {error && (
        <p className="mb-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      <div className="mb-6 rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Status">
            <select
              value={lead.status}
              disabled={saving}
              onChange={(e) => void patch({ status: e.target.value })}
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
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
              {saving && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
          </Field>
        </div>

        <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2" style={{ color: "var(--body)" }}>
          <div>
            <span className="font-medium" style={{ color: "var(--ink)" }}>Source:</span>{" "}
            {SOURCE_LABEL[lead.source] ?? lead.source}
          </div>
          <div>
            <span className="font-medium" style={{ color: "var(--ink)" }}>First activity:</span> {fmtDate(lead.createdAt)}
          </div>
          <div>
            <span className="font-medium" style={{ color: "var(--ink)" }}>Last contacted:</span> {fmtDate(lead.lastContactedAt)}
          </div>
          <div>
            <span className="font-medium" style={{ color: "var(--ink)" }}>Attribution:</span>{" "}
            {attr?.source || attr?.campaign
              ? [attr.source, attr.medium, attr.campaign].filter(Boolean).join(" / ")
              : "Unattributed"}
          </div>
        </div>
      </div>

      {lead.interests.length > 0 && (
        <Section title="Interested in">
          <div className="flex flex-wrap gap-2">
            {lead.interests.map((interest, i) => (
              <span key={`${interest.itemId}-${i}`} className="rounded-full px-3 py-1.5 text-[12.5px] font-medium" style={{ background: "var(--bg-soft)", color: "var(--ink)" }}>
                {interest.title || interest.itemId}
              </span>
            ))}
          </div>
        </Section>
      )}

      {data.orders.length > 0 && (
        <Section title="Orders">
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
        </Section>
      )}

      <div className="mb-6 rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <h2 className="mb-4 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>Add a note</h2>
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
      </div>

      <Section title="Activity">
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
                    <span className="text-[12px]" style={{ color: "var(--body)" }}>{fmtDate(item.at)}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] whitespace-pre-wrap" style={{ color: "var(--body)" }}>{item.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function BackLink() {
  return (
    <Link href="/dashboard/admin/leads" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--body)" }}>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <h2 className="mb-4 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>{title}</h2>
      {children}
    </div>
  );
}
