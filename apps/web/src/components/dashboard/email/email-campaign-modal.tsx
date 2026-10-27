"use client";

import { useMemo, useState } from "react";
import { Code2, Eye, Loader2, Mail, RotateCcw, Send, X } from "lucide-react";
import { EMAIL_TEMPLATES } from "@/lib/automation/email-templates";
import { renderEmailSubject, renderEmailTemplate } from "@/lib/automation/render";

const MAX_PERSONALIZED = 200;
const MAX_SUBJECT = 200;
const MAX_HTML = 200_000;

const PLACEHOLDER_HINTS: [string, string][] = [
  ["{{user.name}}", "Recipient's name"],
  ["{{user.email}}", "Recipient's email"],
  ["{{siteUrl}}", "Site homepage"],
  ["{{now|date}}", "Current date"],
];

type AudienceType = "all" | "role" | "emails";

export function EmailCampaignModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: (count: number) => void;
}) {
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [roles, setRoles] = useState<string[]>(["user"]);
  const [emailsText, setEmailsText] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [campaign, setCampaign] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"compose" | "preview">("compose");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const samplePayload = { user: { id: "", name: "Student", email: "student@example.com" } };

  const preview = useMemo(
    () => ({
      subject: renderEmailSubject(subject, samplePayload),
      html: renderEmailTemplate(body, samplePayload),
    }),
    [subject, body],
  );

  const hasPlaceholders = /\{\{\s*[\w.]+/.test(subject) || /\{\{\s*[\w.]+/.test(body);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    if (!id) return;
    const t = EMAIL_TEMPLATES.find((x) => x.id === id);
    if (t) {
      setSubject(t.subject);
      setBody(t.body);
      if (!campaign) setCampaign(t.id);
      setTab("compose");
    }
  };

  const resetContent = () => {
    setTemplateId("");
    setCampaign("");
    setSubject("");
    setBody("");
    setError(null);
  };

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const buildAudience = () => {
    if (audienceType === "all") return { type: "all" as const };
    if (audienceType === "role") return { type: "role" as const, roles };
    const emails = emailsText
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);
    return { type: "emails" as const, emails };
  };

  const send = async () => {
    if (!subject.trim() || !body.trim() || sending) return;
    if (audienceType === "emails" && !emailsText.trim()) {
      setError("Paste at least one recipient email.");
      return;
    }
    if (audienceType === "role" && roles.length === 0) {
      setError("Select at least one role.");
      return;
    }
    setSending(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: buildAudience(),
          subject,
          html: body,
          campaign: campaign || templateId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to send email");
      setSummary(`Sent to ${data.sent} of ${data.total} recipient${data.total === 1 ? "" : "s"}`);
      setTimeout(() => onSent(data.sent), 1100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(15,17,28,0.5)", backdropFilter: "blur(2px)" }} />
      <div
        className="relative w-full max-w-2xl h-full sm:h-[88vh] flex flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
        style={{ borderColor: "var(--line)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <Mail size={16} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                New email campaign
              </p>
              <p className="text-[12px] truncate" style={{ color: "var(--body)" }}>
                Send to all users, a role segment, or a custom list
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 hover:bg-[#F1F0F8] disabled:opacity-40"
            style={{ borderColor: "var(--line)", color: "var(--body)" }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Audience */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
              Audience
            </p>
            <div className="flex items-center gap-1 rounded-xl border p-1 self-start" style={{ borderColor: "var(--line)" }}>
              {(
                [
                  { key: "all", label: "All users" },
                  { key: "role", label: "By role" },
                  { key: "emails", label: "Paste emails" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setAudienceType(t.key)}
                  className="rounded-lg px-3 py-[6px] text-[12.5px] font-semibold transition-colors duration-150"
                  style={audienceType === t.key ? { background: "var(--brand)", color: "#fff" } : { color: "var(--body)" }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {audienceType === "role" && (
              <div className="flex flex-wrap items-center gap-1.5">
                {(["user", "admin", "moderator"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-[6px] text-[12px] font-medium capitalize transition-colors"
                    style={
                      roles.includes(role)
                        ? { borderColor: "var(--brand)", color: "var(--brand)", background: "var(--brand-soft)" }
                        : { borderColor: "var(--line)", color: "var(--body)" }
                    }
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}

            {audienceType === "emails" && (
              <textarea
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                placeholder="One email per line or comma-separated"
                className="w-full min-h-[72px] resize-y rounded-xl border bg-white px-3.5 py-3 text-[12.5px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            )}
          </div>

          {/* Tab switch */}
          <div className="flex items-center gap-1 rounded-xl border p-1 self-start" style={{ borderColor: "var(--line)" }}>
            {(
              [
                { key: "compose", label: "Compose", icon: Code2 },
                { key: "preview", label: "Preview", icon: Eye },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-[6px] text-[12.5px] font-semibold transition-colors duration-150"
                style={tab === t.key ? { background: "var(--brand)", color: "#fff" } : { color: "var(--body)" }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "compose" ? (
            <>
              {/* Template picker */}
              <div className="flex flex-col gap-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                  Start from a template
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="flex-1 text-[13px] rounded-xl border bg-white px-3 py-[10px] focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    aria-label="Email template"
                  >
                    <option value="">Blank message…</option>
                    {EMAIL_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={resetContent}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-[10px] text-[12.5px] font-semibold transition-colors duration-150 hover:bg-[var(--bg-soft)]"
                    style={{ borderColor: "var(--line)", color: "var(--body)" }}
                  >
                    <RotateCcw size={13} />
                    Clear
                  </button>
                </div>
              </div>

              {/* Campaign name */}
              <div className="flex flex-col gap-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                  Campaign name (for tracking)
                </p>
                <input
                  type="text"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="e.g. march-webinar-launch"
                  maxLength={100}
                  className="text-[13px] rounded-xl border bg-white px-3.5 py-[10px] focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                    Subject
                  </p>
                  <span className="text-[11px] tabular-nums" style={{ color: subject.length > MAX_SUBJECT ? "#C0392B" : "var(--body)" }}>
                    {subject.length}/{MAX_SUBJECT}
                  </span>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`e.g. A special offer inside, {{user.name}}`}
                  maxLength={MAX_SUBJECT}
                  className="text-[13px] rounded-xl border bg-white px-3.5 py-[10px] focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              {/* HTML body */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                    HTML body
                  </p>
                  <span className="text-[11px] tabular-nums" style={{ color: body.length > MAX_HTML ? "#C0392B" : "var(--body)" }}>
                    {body.length.toLocaleString()} chars
                  </span>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck={false}
                  placeholder={`<div style="font-family:'Segoe UI',sans-serif;padding:24px;">\n  <h2>Hi {{user.name}},</h2>\n  <p>…</p>\n</div>`}
                  className="w-full min-h-[240px] resize-y text-[12.5px] leading-relaxed rounded-xl border bg-white font-mono px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-dashed px-3 py-2" style={{ borderColor: "var(--line)" }}>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Personalise
                  </span>
                  {PLACEHOLDER_HINTS.map(([token, label]) => (
                    <span key={token} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--body)" }}>
                      <code className="text-[11px] font-semibold" style={{ color: "var(--brand)" }}>
                        {token}
                      </code>
                      {label}
                    </span>
                  ))}
                </div>
                {hasPlaceholders && audienceType !== "emails" && (
                  <p className="text-[12px] font-semibold" style={{ color: "#DB8A2E" }}>
                    Personalised templates are limited to {MAX_PERSONALIZED} recipients — larger audiences will be blocked.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--body)" }}>
                Preview
              </p>
              {!subject.trim() && !body.trim() ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center"
                  style={{ borderColor: "var(--line)", color: "var(--body)" }}
                >
                  <Mail size={20} />
                  <p className="text-[13px]">Add a subject and HTML body to preview.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border px-3.5 py-2.5" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mr-2" style={{ color: "var(--body)" }}>
                      Subject
                    </span>
                    {preview.subject}
                  </div>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--line)" }}>
                    <iframe
                      title="Email preview"
                      srcDoc={`<!doctype html><html><body>${preview.html}</body></html>`}
                      className="w-full bg-white"
                      style={{ height: 380, border: "none" }}
                      sandbox=""
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 flex flex-col gap-2" style={{ borderColor: "var(--line)" }}>
          {error && (
            <p className="text-[12.5px] font-semibold" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}
          {summary && (
            <p className="text-[12.5px] font-semibold" style={{ color: "var(--brand)" }}>
              {summary}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px]" style={{ color: "var(--body)" }}>
              Sent via Resend · batch size 100
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="rounded-xl border px-4 py-[10px] text-[13px] font-semibold transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-40"
                style={{ borderColor: "var(--line)", color: "var(--body)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending || !subject.trim() || !body.trim()}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-[10px] text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
                style={{ background: "var(--brand)" }}
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? "Sending…" : "Send campaign"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
