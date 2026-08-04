"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

type Seminar = {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  image: string | null;
  type: "free" | "paid";
  price: number;
  url: string | null;
  duration: string | null;
  registrations: number;
};

type Registration = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  registeredAt: string;
};

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60";

const emptyForm = {
  title: "",
  description: "",
  dateTime: "",
  duration: "",
  type: "free" as "free" | "paid",
  price: "",
  image: "",
  url: "",
};

export function SeminarManage() {
  const { user } = useAuth();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [viewing, setViewing] = useState<{ id: string; title: string } | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regLoading, setRegLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/seminars?all=true", { cache: "no-store" });
      const data = await res.json();
      setSeminars(data.seminars ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (s: Seminar) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      description: s.description ?? "",
      dateTime: toLocalInput(s.dateTime),
      duration: s.duration ?? "",
      type: s.type,
      price: s.price ? String(s.price) : "",
      image: s.image ?? "",
      url: s.url ?? "",
    });
    setFormOpen(true);
  };

  const save = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    const url = editingId ? `/api/seminars/${editingId}` : "/api/seminars";
    try {
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setFormOpen(false);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (s: Seminar) => {
    if (!confirm(`Delete seminar "${s.title}"? This also removes its registrations.`)) return;
    try {
      const res = await fetch(`/api/seminars/${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const viewRegistrations = async (s: Seminar) => {
    setViewing({ id: s.id, title: s.title });
    setRegLoading(true);
    setRegistrations([]);
    try {
      const res = await fetch(`/api/seminars/${s.id}/registrations`, { cache: "no-store" });
      const data = await res.json();
      setRegistrations(data.registrations ?? []);
    } catch {
      // ignored
    } finally {
      setRegLoading(false);
    }
  };

  if (!user) return <p style={{ color: "var(--body)" }}>Loading…</p>;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
            Seminars
          </h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--body)" }}>
            Create and manage seminars, and view who registered.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
          style={{ background: "var(--brand)" }}
        >
          + New seminar
        </button>
      </div>

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {formOpen && (
        <div className="rounded-[24px] border bg-white p-[clamp(20px,3vw,28px)]" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-display text-[16px] font-semibold mb-5" style={{ color: "var(--ink)" }}>
            {editingId ? "Edit seminar" : "New seminar"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Study Abroad: UK Visas Explained"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What will attendees learn?"
                rows={3}
                className={inputClass + " resize-none"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Date & time *
              </label>
              <input
                type="datetime-local"
                value={form.dateTime}
                onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Duration
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 45 minutes"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "free" | "paid" })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {form.type === "paid" && (
              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  Price (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="25"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Image URL
              </label>
              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://…"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Event URL / link
              </label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://… (link attendees use to join)"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={save}
              className="rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              {editingId ? "Save changes" : "Create seminar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="text-[13.5px] font-medium px-4 py-[11px]"
              style={{ color: "var(--body)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {seminars.map((s) => (
          <div key={s.id} className="rounded-[24px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
            <div className="flex flex-col sm:flex-row">
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.title} className="w-full sm:w-[220px] sm:min-h-[140px] h-[150px] sm:h-auto object-cover" />
              ) : (
                <div
                  className="w-full sm:w-[220px] h-[150px] sm:h-auto shrink-0 flex items-center justify-center text-[12px] text-white font-semibold px-4 text-center"
                  style={{
                    background:
                      s.type === "paid"
                        ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                        : "linear-gradient(135deg,#0FA968,#18A97A)",
                  }}
                >
                  FlyBridge
                </div>
              )}

              <div className="flex-1 p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                    style={
                      s.type === "paid"
                        ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                        : { background: "var(--brand-soft)", color: "var(--brand)" }
                    }
                  >
                    {s.type === "paid" ? `Paid · $${s.price}` : "Free"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    {new Date(s.dateTime).toLocaleDateString()}
                  </span>
                  {s.duration && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                      {s.duration}
                    </span>
                  )}
                  <span
                    className="font-mono text-[10px] font-semibold rounded-full px-3 py-[5px]"
                    style={{ background: "var(--bg-soft)", color: "var(--ink)" }}
                  >
                    {s.registrations} registered
                  </span>
                </div>
                <h3 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                  {s.title}
                </h3>
                {s.description && (
                  <p className="text-[13px] mt-1 line-clamp-2" style={{ color: "var(--body)" }}>
                    {s.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => viewRegistrations(s)}
                    className="text-[13px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                  >
                    View registrations
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="text-[13px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    className="text-[13px] font-medium rounded-full border px-4 py-[8px] transition-all duration-200"
                    style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}
                  >
                    Delete
                  </button>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] font-medium"
                      style={{ color: "var(--brand)" }}
                    >
                      Event link ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {viewing?.id === s.id && (
              <div className="border-t bg-soft" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
                <div className="px-5 py-4 flex items-center justify-between">
                  <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                    Registrations — {viewing.title}
                  </p>
                  <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
                    {registrations.length} joinees
                  </span>
                </div>
                {regLoading ? (
                  <div className="px-5 pb-5 text-[13px]" style={{ color: "var(--body)" }}>
                    Loading…
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="px-5 pb-5 text-[13px]" style={{ color: "var(--body)" }}>
                    No registrations yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[520px]">
                      <thead>
                        <tr className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                          <th className="px-5 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Phone</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-5 py-3 font-medium">Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((r) => (
                          <tr key={r.id} className="border-t text-[13.5px]" style={{ borderColor: "var(--line)" }}>
                            <td className="px-5 py-3 font-medium" style={{ color: "var(--ink)" }}>
                              {r.name}
                            </td>
                            <td className="px-4 py-3" style={{ color: "var(--body)" }}>
                              {r.phone ?? "—"}
                            </td>
                            <td className="px-4 py-3" style={{ color: "var(--body)" }}>
                              {r.email}
                            </td>
                            <td className="px-5 py-3 text-[12.5px]" style={{ color: "var(--body)" }}>
                              {new Date(r.registeredAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {seminars.length === 0 && !formOpen && (
          <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
            No seminars yet — click "New seminar" to create your first one.
          </p>
        )}
      </div>
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}