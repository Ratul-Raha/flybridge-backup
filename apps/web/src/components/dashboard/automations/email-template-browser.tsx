"use client";

import { useMemo, useState } from "react";
import { Mail, Eye, Code2, Copy, Check, Search, X, Smartphone, Monitor } from "lucide-react";
import { eventLabel } from "@/lib/events/catalog";

export type TemplatePreview = {
  id: string;
  name: string;
  description: string;
  previewBody: string;
  events: string[];
  subject: string;
  html: string;
};

const ACCENT = "#6E4CFF";

export function EmailTemplateBrowser({ templates, initialTemplateId }: { templates: TemplatePreview[]; initialTemplateId?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTemplateId && templates.some((t) => t.id === initialTemplateId) ? initialTemplateId : null
  );
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const [copied, setCopied] = useState<string | null>(null);

  const allEvents = useMemo(() => Array.from(new Set(templates.flatMap((t) => t.events))).sort(), [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (eventFilter !== "all" && !t.events.includes(eventFilter)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.events.some((e) => eventLabel(e).toLowerCase().includes(q))
      );
    });
  }, [templates, query, eventFilter]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Mail size={17} style={{ color: ACCENT }} />
          <h1 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
            Email templates
          </h1>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${ACCENT}1A`, color: ACCENT }}>
            {templates.length}
          </span>
        </div>
        <p className="text-[13px]" style={{ color: "var(--body)" }}>
          Every template used by automation flows. Choose one to preview how it renders with realistic sample data.
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
          {filtered.map((t) => (
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
              </div>
            </button>
          ))}
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
                  onClick={() => copyText("subject", selected.subject)}
                  className="mt-1 flex items-center gap-1 text-[12px] font-medium truncate hover:opacity-75"
                  style={{ color: "var(--brand-2)" }}
                >
                  {copied === "subject" ? <Check size={12} /> : <Copy size={12} />}
                  {selected.subject}
                </button>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-black/5"
                style={{ color: "var(--body)" }}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b flex-wrap" style={{ borderColor: "var(--line)" }}>
              <p className="text-[12.5px] leading-relaxed text-[#8B93A7]">{selected.previewBody}</p>
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center rounded-full border p-0.5" style={{ borderColor: "var(--line)" }}>
                  {(["preview", "code"] as const).map((t) => (
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
                      {t === "preview" ? <Eye size={13} /> : <Code2 size={13} />}
                      {t === "preview" ? "Preview" : "HTML"}
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

            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)", background: "#E5E9F2" }}>
              {tab === "preview" ? (
                <div className="flex justify-center p-4">
                  <div
                    className="overflow-hidden rounded-xl bg-white transition-all duration-200"
                    style={{ width: device === "mobile" ? 390 : 640, boxShadow: "0 14px 40px -18px rgba(18,32,67,0.4)" }}
                  >
                    <iframe
                      title={`${selected.name} preview`}
                      srcDoc={selected.html}
                      className="w-full border-0 bg-white"
                      style={{ height: "76vh", minHeight: 480 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="rounded-xl bg-[#0F1524] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                        email.html · {selected.html.length.toLocaleString()} chars
                      </span>
                      <button
                        onClick={() => copyText("html", selected.html)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white transition bg-white/10 hover:bg-white/20"
                      >
                        {copied === "html" ? <Check size={13} /> : <Copy size={13} />}
                        {copied === "html" ? "Copied" : "Copy HTML"}
                      </button>
                    </div>
                    <pre className="max-h-[70vh] overflow-auto text-[12px] leading-relaxed text-white/85 whitespace-pre-wrap break-all">
                      {selected.html}
                    </pre>
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