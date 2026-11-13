"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  Search,
  Settings2,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CrmTabs } from "@/components/dashboard/leads/crm-tabs";
import {
  CreateListModal,
  FieldsModal,
  ImportModal,
  LeadFormModal,
  type FieldItem,
  type LeadItem,
  type ListItem,
} from "@/components/dashboard/leads/lead-modals";
import {
  PRIORITY_META,
  SOURCE_LABEL,
  STATUS_META,
  PriorityPill,
  SourcePill,
  StatusPill,
  fmtDate,
} from "@/components/dashboard/leads/lead-meta";

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

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[8.5px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";
const cellBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150 hover:bg-[var(--bg-soft)]";

function InlineSelect({
  value,
  options,
  onCommit,
  onCancel,
  placeholder,
}: {
  value: string;
  options: Record<string, string>;
  onCommit: (v: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  return (
    <select
      autoFocus
      defaultValue={value}
      onChange={(e) => onCommit(e.target.value)}
      onBlur={onCancel}
      className="w-full rounded-lg border bg-white px-2 py-[6px] text-[12.5px] outline-none"
      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {Object.entries(options).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function LeadManage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedQ = useDebounced(searchInput, 300);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [owner, setOwner] = useState("");
  const [followup, setFollowup] = useState("");
  const [list, setList] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 25;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; field: "status" | "priority" | "owner" } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/lead-lists", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setLists(data.lists ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadFields = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/lead-fields", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setFields((data.fields ?? []).filter((f: FieldItem) => f.isActive));
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (source) params.set("source", source);
      if (owner) params.set("owner", owner);
      if (followup) params.set("followup", followup);
      if (list) params.set("list", list);
      if (sort !== "newest") params.set("sort", sort);
      params.set("page", String(page));
      params.set("perPage", String(perPage));

      const res = await fetch(`/api/admin/leads?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load leads");
      setLeads(data.leads ?? []);
      setStats(data.stats ?? null);
      setTotal(data.pagination?.total ?? 0);
      if (Array.isArray(data.fields)) setFields(data.fields.filter((f: FieldItem) => f.isActive !== false));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, status, priority, source, owner, followup, list, sort, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadLists();
    void loadFields();
  }, [loadLists, loadFields]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status, priority, source, owner, followup, list, sort]);

  const clearSelection = () => setSelected(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPage = leads.length > 0 && leads.every((l) => selected.has(l.id));
  const toggleSelectAll = () => {
    if (allOnPage) clearSelection();
    else setSelected(new Set(leads.map((l) => l.id)));
  };

  const patchLead = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Update failed");
      }
      await load();
    },
    [load]
  );

  const commitInline = async (id: string, field: "status" | "priority" | "owner", value: string) => {
    setEditing(null);
    if (field === "owner") {
      await patchLead(id, { owner: value === "me" ? "me" : null });
    } else {
      await patchLead(id, { [field]: value });
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm("Delete this lead?")) return;
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    await load();
  };

  const runBulk = async (action: "status" | "priority" | "owner" | "delete", value?: string) => {
    if (selected.size === 0) return;
    const count = selected.size;
    if (action === "delete" && !window.confirm(`Delete ${count} selected lead${count === 1 ? "" : "s"}?`)) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action, value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Bulk action failed");
      clearSelection();
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Manage interested people and your sales pipeline."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-[9px] text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <Upload size={14} /> Import CSV
            </button>
            <button
              type="button"
              onClick={() => setFieldsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-[9px] text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <Settings2 size={14} /> Manage fields
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingLead(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white transition-all hover:-translate-y-[1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={15} /> New lead
            </button>
          </div>
        }
      />

      <CrmTabs />

      {error && (
        <p className="mb-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>
      )}

      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="All leads" value={stats.total} />
          <Stat label="New" value={stats.new ?? 0} />
          <Stat label="Follow-up" value={stats["follow-up"] ?? 0} />
          <Stat label="Converted" value={stats.converted ?? 0} />
          <Stat label="Overdue" value={stats.overdue ?? 0} accent />
          <Stat label="Unassigned" value={stats.unassigned ?? 0} />
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 rounded-xl border bg-white p-3 flex flex-col gap-2.5" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 min-w-[200px]">
            <select
              value={list}
              onChange={(e) => setList(e.target.value)}
              className={`${selectClass} flex-1`}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              aria-label="Filter by list"
            >
              <option value="">All lists</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}{l.leadCount ? ` (${l.leadCount})` : ""}</option>
              ))}
              <option value="unlisted">Unassigned list</option>
            </select>
            <button
              type="button"
              onClick={() => setCreateListOpen(true)}
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              aria-label="Create list"
              title="Create list"
            >
              <Plus size={15} />
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full rounded-xl border bg-white pl-10 pr-4 py-[8.5px] text-[13.5px] outline-none focus:ring-2 focus:ring-brand-2/30"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Filter by status">
            <option value="">All statuses</option>
            {Object.entries(STATUS_META).map(([v, m]) => (
              <option key={v} value={v}>{m.label}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Filter by priority">
            <option value="">All priorities</option>
            {Object.entries(PRIORITY_META).map(([v, m]) => (
              <option key={v} value={v}>{m.label}</option>
            ))}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Filter by source">
            <option value="">All sources</option>
            {Object.entries(SOURCE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={selectClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Filter by owner">
            <option value="">Everyone</option>
            <option value="mine">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <select value={followup} onChange={(e) => setFollowup(e.target.value)} className={selectClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Filter by follow-up">
            <option value="">Any follow-up</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="upcoming">Upcoming</option>
            <option value="none">No follow-up</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="followup">Follow-up date</option>
          </select>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div
          className="mb-4 rounded-xl border px-4 py-3 flex flex-wrap items-center gap-2.5"
          style={{ borderColor: "rgba(47,95,224,0.35)", background: "rgba(47,95,224,0.05)" }}
        >
          <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{selected.size} selected</span>
          <button type="button" onClick={clearSelection} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: "var(--body)" }}>
            <X size={12} /> Clear
          </button>
          <span className="flex-1" />
          <div className="flex flex-wrap items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => e.target.value && runBulk("status", e.target.value)}
              className={selectClass + " !py-[7px]"}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <option value="" disabled>Set status…</option>
              {Object.entries(STATUS_META).map(([v, m]) => (
                <option key={v} value={v}>{m.label}</option>
              ))}
            </select>
            <select
              defaultValue=""
              onChange={(e) => e.target.value && runBulk("priority", e.target.value)}
              className={selectClass + " !py-[7px]"}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <option value="" disabled>Set priority…</option>
              {Object.entries(PRIORITY_META).map(([v, m]) => (
                <option key={v} value={v}>{m.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => runBulk("owner", "me")}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-[8px] text-[12.5px] font-semibold disabled:opacity-50"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              Assign to me
            </button>
            <button
              type="button"
              onClick={() => runBulk("delete")}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-[8px] text-[12.5px] font-semibold text-white disabled:opacity-50"
              style={{ background: "#C0392B" }}
            >
              {bulkBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "var(--line)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]" style={{ minWidth: 960 }}>
            <thead>
              <tr className="border-b" style={{ background: "var(--bg-soft)", borderColor: "var(--line)" }}>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer"
                    style={{ accentColor: "var(--brand)" }}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Lead</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Phone</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Source</th>
                {fields.map((f) => (
                  <th key={f.id} className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>{f.label}</th>
                ))}
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Status</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Priority</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Owner</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Follow-up</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Created</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11 + fields.length} className="px-5 py-14 text-center" style={{ color: "var(--body)" }}>
                    <Loader2 size={18} className="animate-spin mx-auto mb-2" />
                    Loading leads…
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={11 + fields.length} className="px-5 py-14 text-center" style={{ color: "var(--body)" }}>
                    <Users size={22} className="mx-auto mb-3" style={{ color: "var(--body)" }} />
                    <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>No leads found</p>
                    <p className="mt-1 text-[13px]">Leads appear when someone joins a waitlist, registers for a seminar, submits a form, or you add one manually.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const followup = lead.followUpAt ? new Date(lead.followUpAt) : null;
                  const overdue = followup && followup.getTime() < Date.now() && !["converted", "not-interested", "unqualified"].includes(lead.status);
                  return (
                    <tr key={lead.id} className="border-b transition-colors hover:bg-[var(--bg-soft)]" style={{ borderColor: "var(--line)" }}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="h-4 w-4 cursor-pointer" style={{ accentColor: "var(--brand)" }} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Link href={`/dashboard/admin/crm/leads/${lead.id}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white" style={{ background: "var(--brand)" }}>
                            {lead.name?.[0]?.toUpperCase() ?? "L"}
                          </Link>
                          <div className="min-w-0">
                            <Link href={`/dashboard/admin/crm/leads/${lead.id}`} className="block text-[13.5px] font-semibold truncate hover:underline" style={{ color: "var(--ink)" }}>
                              {lead.name}
                            </Link>
                            <p className="text-[12px] truncate" style={{ color: "var(--body)" }}>{lead.email || "No email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12.5px]" style={{ color: "var(--body)" }}>{lead.phone || "—"}</td>
                      <td className="px-3 py-3"><SourcePill source={lead.source} /></td>
                      {fields.map((f) => (
                        <td key={f.id} className="px-3 py-3 text-[12.5px]" style={{ color: "var(--body)" }}>
                          {lead.customFields?.[f.name] != null && lead.customFields[f.name] !== "" ? String(lead.customFields[f.name]) : "—"}
                        </td>
                      ))}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {editing?.id === lead.id && editing.field === "status" ? (
                          <InlineSelect value={lead.status} options={Object.fromEntries(Object.entries(STATUS_META).map(([v, m]) => [v, m.label]))} onCommit={(v) => commitInline(lead.id, "status", v)} onCancel={() => setEditing(null)} />
                        ) : (
                          <button type="button" onClick={() => setEditing({ id: lead.id, field: "status" })} title="Change status">
                            <StatusPill status={lead.status} />
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {editing?.id === lead.id && editing.field === "priority" ? (
                          <InlineSelect value={lead.priority} options={Object.fromEntries(Object.entries(PRIORITY_META).map(([v, m]) => [v, m.label]))} onCommit={(v) => commitInline(lead.id, "priority", v)} onCancel={() => setEditing(null)} />
                        ) : (
                          <button type="button" onClick={() => setEditing({ id: lead.id, field: "priority" })} title="Change priority">
                            <PriorityPill priority={lead.priority} />
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {editing?.id === lead.id && editing.field === "owner" ? (
                          <InlineSelect
                            value={lead.owner ? "me" : ""}
                            options={{ "": "Unassigned", me: "Assign to me" }}
                            onCommit={(v) => commitInline(lead.id, "owner", v)}
                            onCancel={() => setEditing(null)}
                          />
                        ) : (
                          <button type="button" onClick={() => setEditing({ id: lead.id, field: "owner" })} className="text-[12.5px] font-medium hover:underline" style={{ color: lead.owner ? "var(--ink)" : "var(--body)" }} title="Change owner">
                            {lead.owner ? "Assigned" : "Unassigned"}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[12.5px]" style={{ color: overdue ? "#C0392B" : "var(--body)" }}>
                        {lead.followUpAt ? (overdue ? `Overdue · ${fmtDate(lead.followUpAt)}` : fmtDate(lead.followUpAt)) : "—"}
                      </td>
                      <td className="px-3 py-3 text-[12.5px]" style={{ color: "var(--body)" }}>{fmtDate(lead.createdAt)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/dashboard/admin/crm/leads/${lead.id}`} className={cellBtn} style={{ borderColor: "var(--line)", color: "var(--body)" }} aria-label="View">
                            <Eye size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLead(lead);
                              setFormOpen(true);
                            }}
                            className={cellBtn}
                            style={{ borderColor: "var(--line)", color: "var(--body)" }}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <span className="text-[13px] leading-none">✎</span>
                          </button>
                          <button type="button" onClick={() => deleteLead(lead.id)} className={cellBtn} style={{ borderColor: "var(--line)", color: "#C0392B" }} aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
            Page {page} of {totalPages} · {total} leads
          </p>
          <div className="flex gap-1.5">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-40" style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Previous">
              <ChevronLeft size={15} />
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-40" style={{ borderColor: "var(--line)", color: "var(--ink)" }} aria-label="Next">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {formOpen && (
        <LeadFormModal
          mode={editingLead ? "edit" : "create"}
          lead={editingLead}
          lists={lists}
          fields={fields}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            await load();
            await loadLists();
          }}
        />
      )}
      {importOpen && <ImportModal lists={lists} onClose={() => setImportOpen(false)} onImported={() => { void load(); void loadLists(); }} />}
      {fieldsOpen && <FieldsModal onClose={() => setFieldsOpen(false)} onChanged={() => void loadFields()} />}
      {createListOpen && (
        <CreateListModal
          onClose={() => setCreateListOpen(false)}
          onCreated={async (id) => {
            await loadLists();
            if (id) setList(id);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
      <p className="text-[11.5px] font-medium" style={{ color: "var(--body)" }}>{label}</p>
      <p className="mt-1 font-display text-[20px] font-semibold tabular-nums" style={{ color: accent ? "#C0392B" : "var(--ink)" }}>
        {value}
      </p>
    </div>
  );
}
