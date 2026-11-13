"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Loader2, Plus, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SOURCE_LABEL, STATUS_META, StatusPill, fmtDate } from "@/components/dashboard/leads/lead-meta";

type LeadItem = {
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
  customer: boolean;
};

type Stats = {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  "follow-up": number;
  converted: number;
  "not-interested": number;
  unqualified: number;
  overdue: number;
  unassigned: number;
};

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-[10px] text-[14px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12.5px] font-medium";

export function LeadManage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [followup, setFollowup] = useState("");
  const [owner, setOwner] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "manual" });
  const [saving, setSaving] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (followup) params.set("followup", followup);
      if (owner) params.set("owner", owner);
      if (sort !== "newest") params.set("sort", sort);
      params.set("page", String(page));
      params.set("perPage", String(perPage));

      const res = await fetch(`/api/admin/leads?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load leads");
      setLeads(data.leads ?? []);
      setStats(data.stats ?? null);
      setTotal(data.pagination?.total ?? 0);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [q, status, followup, owner, sort, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, status, followup, owner, sort]);

  const onSearch = (value: string) => {
    setSearchInput(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setQ(value), 250);
  };

  const createLead = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setFormOpen(false);
      setForm({ name: "", email: "", phone: "", source: "manual" });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="People who have shown interest — waitlists, seminars, inquiries, and checkouts."
        action={
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white transition-all hover:-translate-y-[1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={15} /> New lead
          </button>
        }
      />

      {error && (
        <p className="mb-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {stats && (
        <div className="mb-6 flex flex-wrap gap-3">
          <StatCard label="All leads" value={stats.total} />
          <StatCard label="New" value={stats.new ?? 0} />
          <StatCard label="Follow-up" value={stats["follow-up"] ?? 0} />
          <StatCard label="Converted" value={stats.converted ?? 0} />
          <StatCard label="Overdue" value={stats.overdue ?? 0} accent />
          <StatCard label="Unassigned" value={stats.unassigned ?? 0} />
        </div>
      )}

      {formOpen && (
        <div className="mb-6 rounded-[20px] border bg-white p-5 sm:p-7" style={{ borderColor: "var(--line)" }}>
          <h2 className="mb-5 font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Add a lead manually
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahim Uddin" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="person@example.com" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880…" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                {Object.entries(SOURCE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={() => void createLead()} disabled={saving || !form.name.trim()} className="inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60" style={{ background: "var(--brand)" }}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              Add lead
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-full border px-6 py-[10px] text-[13.5px] font-medium" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
          <input value={searchInput} onChange={(e) => onSearch(e.target.value)} placeholder="Search name, email, or phone…" className={`${inputClass} pl-10`} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} w-auto`} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>{meta.label}</option>
          ))}
        </select>
        <select value={followup} onChange={(e) => setFollowup(e.target.value)} className={`${inputClass} w-auto`} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
          <option value="">Any follow-up</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
          <option value="none">No follow-up set</option>
        </select>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className={`${inputClass} w-auto`} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
          <option value="">Everyone</option>
          <option value="mine">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputClass} w-auto`} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="followup">Follow-up date</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" /> Loading leads…
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-[20px] border bg-white p-10 text-center" style={{ borderColor: "var(--line)" }}>
          <Users size={22} className="mx-auto mb-3" style={{ color: "var(--body)" }} />
          <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>No leads yet</p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
            Leads appear when someone joins a waitlist, registers for a seminar, or you add one manually.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
            Page {page} of {totalPages} · {total} leads
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border px-4 py-[7px] text-[12.5px] font-medium disabled:opacity-40" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              Previous
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border px-4 py-[7px] text-[12.5px] font-medium disabled:opacity-40" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-[20px] border bg-white px-5 py-4" style={{ borderColor: "var(--line)" }}>
      <p className="text-[12px] font-medium" style={{ color: "var(--body)" }}>{label}</p>
      <p className="mt-1 font-display text-[22px] font-semibold tabular-nums" style={{ color: accent ? "#C0392B" : "var(--ink)" }}>
        {value}
      </p>
    </div>
  );
}

function LeadRow({ lead }: { lead: LeadItem }) {
  const followup = lead.followUpAt ? new Date(lead.followUpAt) : null;
  const isOverdue = followup && followup.getTime() < Date.now() && !["converted", "not-interested", "unqualified"].includes(lead.status);
  const interestLabel = lead.interests.length
    ? lead.interests.map((i) => i.title).filter(Boolean).slice(0, 2).join(", ")
    : "";

  return (
    <Link
      href={`/dashboard/admin/leads/${lead.id}`}
      className="flex flex-wrap items-center gap-3 rounded-[20px] border bg-white p-4 transition-shadow hover:shadow-sm"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>{lead.name}</span>
          <StatusPill status={lead.status} />
          {lead.customer && (
            <span className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold" style={{ color: "#065F46", background: "rgba(20,181,126,0.12)" }}>
              Customer
            </span>
          )}
        </div>
        <p className="mt-1 text-[12.5px]" style={{ color: "var(--body)" }}>
          {[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact details"}
        </p>
        <p className="mt-0.5 text-[12px]" style={{ color: "var(--body)" }}>
          {SOURCE_LABEL[lead.source] ?? lead.source}
          {interestLabel ? ` · ${interestLabel}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 text-[12.5px]" style={{ color: "var(--body)" }}>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={13} />
          <span style={{ color: isOverdue ? "#C0392B" : "var(--body)" }}>
            {lead.followUpAt ? (isOverdue ? `Overdue ${fmtDate(lead.followUpAt)}` : fmtDate(lead.followUpAt)) : "No follow-up"}
          </span>
        </span>
        <ArrowRight size={15} style={{ color: "var(--brand)" }} />
      </div>
    </Link>
  );
}
