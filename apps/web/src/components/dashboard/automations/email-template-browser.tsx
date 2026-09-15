"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Eye,
  Code2,
  Copy,
  Check,
  Search,
  X,
  Smartphone,
  Monitor,
  Pencil,
  Save,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";
import { renderEmailTemplate, renderEmailSubject } from "@/lib/automation/render";
import { EMAIL_TEMPLATES } from "@/lib/automation/email-templates";

export type TemplatePreview = {
  id: string;
  name: string;
  description: string;
  previewBody: string;
  events: string[];
  subject: string;
  html: string;
  subjectSource: string;
  bodySource: string;
  samplePayload: Record<string, unknown>;
};

const ACCENT = "#6E4CFF";
const DEFAULT_BY_ID = new Map(EMAIL_TEMPLATES.map((t) => [t.id, { subject: t.subject, body: t.body }]));

export function EmailTemplateBrowser({ templates, initialTemplateId }: { templates: TemplatePreview[]; initialTemplateId?: string }) {
  const [list, setList] = useState<TemplatePreview[]>(templates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTemplateId && templates.some((t) => t.id === initialTemplateId) ? initialTemplateId : null
  );
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [tab, setTab] = useState<"preview" | "code" | "edit">("preview");
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const [copied, setCopied] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allEvents = useMemo(() => Array.from(new Set(list.flatMap((t) => t.events))).sort(), [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((t) => {
      if (eventFilter !== "all" && !t.events.includes(eventFilter)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.events.some((e) => eventLabel(e).toLowerCase().includes(q))
      );
    });
  }, [list, query, eventFilter]);

  const selected = list.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({ subject: selected.subjectSource, body: selected.bodySource });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const flashSoon = (msg: string) => {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2000);
  };

  const live = useMemo(() => {
    if (!selected || !draft) return null;
    try {
      const subject = renderEmailSubject(draft.subject, selected.samplePayload);
      const html = renderEmailTemplate(draft.body, selected.samplePayload);
      return { subject, html, error: null as string | null };
    } catch (err) {
      return {
        subject: "",
        html: "",
        error: err instanceof Error ? err.message : "Invalid template syntax",
      };
    }
  }, [selected, draft]);

  const isCustom = useMemo(
    () =>
      !!selected &&
      (selected.subjectSource !== DEFAULT_BY_ID.get(selected.id)?.subject ||
        selected.bodySource !== DEFAULT_BY_ID.get(selected.id)?.body),
    [selected]
  );

  const previewHtml = live?.html && !live.error ? live.html : selected?.html ?? "";
  const previewSubject = live?.subject ?? selected?.subject ?? "";

  const copyText = async (tag: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  };

  const saveTemplate = async () => {
    if (!selected || !draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: draft.subject, body: draft.body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setList((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, subjectSource: draft.subject, bodySource: draft.body, subject: previewSubject, html: previewHtml }
            : t
        )
      );
      flashSoon("Saved");
    } catch (err) {
      flashSoon(`Save failed — ${err instanceof Error ? err.message : "try again"}`);
    } finally {
      setSaving(false);
    }
  };

  const resetTemplate = async () => {
    if (!selected) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${selected.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      const def = DEFAULT_BY_ID.get(selected.id);
      if (def) {
        const subject = def.subject;
        const body = def.body;
        setDraft({ subject, body });
        setList((prev) =>
          prev.map((t) =>
            t.id === selected.id
              ? {
                  ...t,
                  subjectSource: subject,
                  bodySource: body,
                  subject: renderEmailSubject(subject, t.samplePayload),
                  html: renderEmailTemplate(body, t.samplePayload),
                }
              : t
          )
        );
      }
      flashSoon("Restored defaults");
    } catch (err) {
      flashSoon(`Reset failed — ${err instanceof Error ? err.message : "try again"}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Mail size={17} style={{ color: ACCENT }} />
          <h1 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
            Email templates
          </h1>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${ACCENT}1A`, color: ACCENT }}>
            {list.length}
          </span>
          {isCustom && (
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: "#0FA9681A", color: "#0FA968" }}>
              Customized
            </span>
          )}
        </div>
        <p className="text-[13px]" style={{ color: "var(--body)" }}>
          Every template used by automation flows. Preview with realistic sample data, or edit the subject and HTML source — saved edits override the built-in templates.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: "var(--body)" }} />
          <input
            className="w-full rounded-xl border bg-white pl-9 pr-3 py-2 text-[13px] outline-none transition focus:ring-2 focus:ring-[#6E4CFF]/30"
            style={{ borderColor: "var(--line)" }}
            placeholder="Search templates, subjects, events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border bg-white px-3 py-2 text-[13px] outline-none focus:ring-2"
          style={{ borderColor: "var(--line)" }}
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
        >
          <option value="all">All events</option>
          {allEvents.map((e) => (
            <option key={e} value={e}>
              {eventLabel(e)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border py-14 text-center" style={{ borderColor: "var(--line)" }}>
          <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
            No templates match your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filtered.map((t) => {
            const custom = t.subjectSource !== DEFAULT_BY_ID.get(t.id)?.subject || t.bodySource !== DEFAULT_BY_ID.get(t.id)?.body;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="group rounded-xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-16px_rgba(18,32,67,0.25)]"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-[14px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                    {t.name}
                  </h3>
                  <span className="flex items-center gap-1 text-[11.5px] font-semibold whitespace-nowrap opacity-0 transition group-hover:opacity-100" style={{ color: ACCENT }}>
                    <Eye size={13} /> Preview
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "var(--body)" }}>
                  {t.description}
                </p>
                <p className="mt-2.5 truncate text-[11.5px]" style={{ color: "var(--brand-2)" }}>
                  {t.subject}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.events.map((e) => (
                    <span
                      key={e}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
                      style={{ background: "var(--line)", color: "var(--body)" }}
                    >
                      {eventLabel(e)}
                    </span>
                  ))}
                  {custom && (
                    <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide" style={{ background: "#0FA9681A", color: "#0FA968" }}>
                      Custom
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-3 sm:p-6"
          style={{ background: "rgba(18,22,42,0.55)", backdropFilter: "blur(3px)" }}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full rounded-2xl border bg-white overflow-hidden"
            style={{ maxWidth: 1080, borderColor: "var(--line)", boxShadow: "0 40px 80px -30px rgba(18,32,67,0.45)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b" style={{ borderColor: "var(--line)" }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[15px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                    {selected.name}
                  </h2>
                  {selected.events.map((e) => (
                    <span
                      key={e}
                      className="hidden sm:inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ background: "var(--line)", color: "var(--body)" }}
                    >
                      {eventLabel(e)}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => copyText("subject", previewSubject)}
                  className="mt-1 flex items-center gap-1 text-[12px] font-medium truncate hover:opacity-75"
                  style={{ color: "var(--brand-2)" }}
                >
                  {copied === "subject" ? <Check size={12} /> : <Copy size={12} />}
                  {previewSubject}
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isCustom && (
                  <button
                    onClick={resetTemplate}
                    disabled={resetting}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition hover:bg-black/5 disabled:opacity-50"
                    style={{ borderColor: "var(--line)", color: "#C0392B" }}
                  >
                    {resetting ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    Reset
                  </button>
                )}
                {tab === "edit" && (
                  <button
                    onClick={saveTemplate}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    style={{ background: ACCENT }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {flash === "Saved" ? "Saved" : "Save"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-black/5"
                  style={{ color: "var(--body)" }}
                  aria-label="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b flex-wrap" style={{ borderColor: "var(--line)" }}>
              <p className="text-[12.5px] leading-relaxed text-[#8B93A7]">{selected.previewBody}</p>
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center rounded-full border p-0.5" style={{ borderColor: "var(--line)" }}>
                  {(["preview", "code", "edit"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                      style={
                        tab === t
                          ? { background: ACCENT, color: "#fff" }
                          : { color: "var(--body)" }
                      }
                    >
                      {t === "preview" ? <Eye size={13} /> : t === "code" ? <Code2 size={13} /> : <Pencil size={13} />}
                      {t === "preview" ? "Preview" : t === "code" ? "HTML" : "Edit"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center rounded-full border p-0.5" style={{ borderColor: "var(--line)" }}>
                  {(["mobile", "desktop"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDevice(d)}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                      style={device === d ? { background: "var(--ink)", color: "#fff" } : { color: "var(--body)" }}
                      aria-label={d}
                    >
                      {d === "mobile" ? <Smartphone size={13} /> : <Monitor size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {flash && flash !== "Saved" && (
              <div className="px-5 py-2.5 flex items-center gap-2 text-[12.5px] font-semibold border-b" style={{ background: "#FFF4E5", color: "#B26A00", borderColor: "#FFE4B3" }}>
                <AlertTriangle size={14} /> {flash}
              </div>
            )}

            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)", background: "#E5E9F2" }}>
              {tab === "preview" ? (
                <div className="flex justify-center p-4">
                  <div
                    className="overflow-hidden rounded-xl bg-white transition-all duration-200"
                    style={{ width: device === "mobile" ? 390 : 640, boxShadow: "0 14px 40px -18px rgba(18,32,67,0.4)" }}
                  >
                    <iframe
                      title={`${selected.name} preview`}
                      srcDoc={previewHtml}
                      className="w-full border-0 bg-white"
                      style={{ height: "76vh", minHeight: 480 }}
                    />
                  </div>
                </div>
              ) : tab === "code" ? (
                <div className="p-4">
                  <div className="rounded-xl bg-[#0F1524] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                        email.html · {selected.html.length.toLocaleString()} chars
                      </span>
                      <button
                        onClick={() => copyText("html", previewHtml)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white transition bg-white/10 hover:bg-white/20"
                      >
                        {copied === "html" ? <Check size={13} /> : <Copy size={13} />}
                        {copied === "html" ? "Copied" : "Copy HTML"}
                      </button>
                    </div>
                    <pre className="max-h-[70vh] overflow-auto text-[12px] leading-relaxed text-white/85 whitespace-pre-wrap break-all">
                      {previewHtml}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {live?.error && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-[12.5px] font-medium" style={{ borderColor: "#F5C6C6", background: "#FDECEC", color: "#C0392B" }}>
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <span>
                        Template error: {live.error}. Hint: block tags must be balanced (<code>{"{{#if …}}"}</code>…<code>{"{{/if}}"}</code>, <code>{"{{#each …}}"}</code>…<code>{"{{/each}}"}</code>).
                      </span>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                        Subject
                      </label>
                      <input
                        value={draft?.subject ?? ""}
                        onChange={(e) => setDraft((d) => (d ? { ...d, subject: e.target.value } : d))}
                        className="w-full rounded-xl border bg-white px-3 py-2 text-[13px] font-medium outline-none transition focus:ring-2 focus:ring-[#6E4CFF]/30"
                        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        placeholder="e.g. You're registered — {{seminar.title}}"
                      />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                          HTML source
                        </label>
                        <span className="text-[11px]" style={{ color: "var(--body)" }}>
                          {draft?.body.length.toLocaleString()} chars
                        </span>
                      </div>
                      <textarea
                        value={draft?.body ?? ""}
                        onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
                        spellCheck={false}
                        className="w-full rounded-xl border bg-[#0F1524] px-3 py-3 text-[12px] leading-relaxed text-white/85 outline-none transition focus:ring-2 focus:ring-[#6E4CFF]/40 resize-y font-mono"
                        style={{ borderColor: "var(--line)", minHeight: "46vh", maxHeight: "72vh" }}
                        placeholder="Full HTML email source. Use {{user.name}}, {{#if …}}, {{#each …}} to inject sample data."
                      />
                    </div>
                    <details className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
                      <summary className="cursor-pointer text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                        Template syntax &amp; sample data
                      </summary>
                      <div className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed" style={{ color: "var(--body)" }}>
                        <p>
                          <code className="rounded bg-[#F1F4FB] px-1.5 py-0.5 text-[11.5px]">{"{{path}}"}</code> injects a value (auto-escaped). Filters:{" "}
                          <code className="rounded bg-[#F1F4FB] px-1 py-0.5 text-[11.5px]">|raw, |upper, |lower, |date, |number, |first, |shortid, |url, |year</code>.
                        </p>
                        <p>
                          Blocks: <code className="rounded bg-[#F1F4FB] px-1 py-0.5 text-[11.5px]">{"{{#if order.total === 0}}…{{else}}…{{/if}}"}</code> and{" "}
                          <code className="rounded bg-[#F1F4FB] px-1 py-0.5 text-[11.5px]">{"{{#each order.items}}…{{/each}}"}</code>. Specials:{" "}
                          <code className="rounded bg-[#F1F4FB] px-1 py-0.5 text-[11.5px]">{"{{siteUrl}}"}</code>, <code className="rounded bg-[#F1F4FB] px-1 py-0.5 text-[11.5px]">{"{{now}}"}</code>.
                        </p>
                        <pre className="mt-2 rounded-lg bg-[#F7FAFC] border border-[#E5EAF3] p-3 text-[11px] leading-relaxed text-[#4A5570] whitespace-pre-wrap break-all">
                          {JSON.stringify(selected.samplePayload, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}