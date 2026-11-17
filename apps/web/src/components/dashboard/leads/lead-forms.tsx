"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, FileText, Globe, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CrmTabs } from "@/components/dashboard/leads/crm-tabs";

type FormList = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  formSlug: string;
  formEnabled: boolean;
  leadCount: number;
};

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
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-soft)]"
      style={{ borderColor: "var(--line)", color: copied ? "#0FA968" : "var(--body)" }}
      aria-label="Copy form URL"
      title="Copy form URL"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

export function LeadForms() {
  const [lists, setLists] = useState<FormList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/lead-lists", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load forms");
      setLists(data.lists ?? []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (list: FormList) => {
    setToggling(list.id);
    try {
      const res = await fetch(`/api/admin/lead-lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formEnabled: !list.formEnabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Update failed");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Lead forms"
        subtitle="Every lead list gets a public form automatically. Share the link anywhere."
      />

      <CrmTabs />

      {error && (
        <p className="mb-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      <div
        className="mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5"
        style={{ borderColor: "rgba(111,76,224,0.25)", background: "rgba(111,76,224,0.05)" }}
      >
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <Globe size={16} />
        </span>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
            Forms are created automatically
          </p>
          <p className="mt-0.5 text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
            Each list has its own public form using the active custom fields. There is no public menu
            link — share the URL directly on social media or anywhere else.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border bg-white py-16" style={{ borderColor: "var(--line)" }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--body)" }} />
        </div>
      ) : lists.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-xl border bg-white px-6 py-14 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <FileText size={24} style={{ color: "var(--body)" }} />
          <p className="font-display mt-3 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            No lead lists yet
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
            Create a list from the Leads tab and its form will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lists.map((list) => {
            const url = list.formSlug ? `${origin}/forms/${list.formSlug}` : "";
            return (
              <div
                key={list.id}
                className="rounded-xl border bg-white p-4 sm:p-5"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                        {list.name}
                      </p>
                      {list.isDefault && (
                        <span
                          className="rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                        >
                          Default
                        </span>
                      )}
                      <span
                        className="rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.08em]"
                        style={
                          list.formEnabled
                            ? { background: "rgba(15,169,104,0.12)", color: "#065F46" }
                            : { background: "var(--line)", color: "var(--body)" }
                        }
                      >
                        {list.formEnabled ? "Live" : "Disabled"}
                      </span>
                    </div>
                    {list.description && (
                      <p className="mt-1 text-[12.5px]" style={{ color: "var(--body)" }}>
                        {list.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-[12px]" style={{ color: "var(--body)" }}>
                      {list.leadCount.toLocaleString()} lead{list.leadCount === 1 ? "" : "s"} in this list
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(list)}
                    disabled={toggling === list.id}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-[12px] font-semibold transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-50"
                    style={{ borderColor: "var(--line)", color: list.formEnabled ? "#C0392B" : "var(--brand)" }}
                  >
                    {toggling === list.id && <Loader2 size={13} className="animate-spin" />}
                    {list.formEnabled ? "Disable form" : "Enable form"}
                  </button>
                </div>

                {url && (
                  <div className="mt-3.5 flex items-center gap-2">
                    <input
                      readOnly
                      value={url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 rounded-lg border bg-[var(--bg-soft)] px-3 py-[9px] font-mono text-[12px] outline-none"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                      aria-label={`Public form URL for ${list.name}`}
                    />
                    <CopyButton text={url} />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--bg-soft)]"
                      style={{ borderColor: "var(--line)", color: "var(--body)" }}
                      aria-label="Open form"
                      title="Open form"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
