"use client";

import { EVENT_LIST } from "@/lib/events/catalog";
import { triggerEventOf } from "@/lib/automation/graph";
import { EMAIL_TEMPLATES, emailTemplateById, emailTemplatesForEvent } from "@/lib/automation/email-templates";
import { MAX_DELAY_SECONDS } from "@/lib/automation/types";
import type { AutomationNode, AutomationGraph, ActionType, ConditionOperator, DelayUnit, RecipientSetting } from "@/lib/automation/types";
import { Label, fieldClass } from "./ui";

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "is equal to" },
  { value: "not_equals", label: "is not equal to" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "exists", label: "exists" },
  { value: "not_exists", label: "does not exist" },
  { value: "gt", label: "is greater than" },
  { value: "lt", label: "is less than" },
];

function actionTypeLabel(t: ActionType) {
  if (t === "send_email") return "Send email";
  if (t === "send_notification") return "Send notification";
  if (t === "delay") return "Delay";
  return "Webhook";
}

export function NodeConfig({
  node,
  graph,
  onChange,
}: {
  node: AutomationNode;
  graph: AutomationGraph;
  onChange: (node: AutomationNode) => void;
}) {
  const setData = (patch: Partial<AutomationNode["data"]>) => {
    onChange({ ...node, data: { ...node.data, ...patch } });
  };

  const eventFields = (() => {
    const event = triggerEventOf(graph);
    const entry = event ? EVENT_LIST.find((e) => e.name === event) : null;
    return entry?.fields ?? [];
  })();

  const fitTemplates = emailTemplatesForEvent(triggerEventOf(graph));
  const otherTemplates = EMAIL_TEMPLATES.filter((t) => !fitTemplates.includes(t));
  const selectedTemplate = node.data.templateId ? emailTemplateById(node.data.templateId) : null;

  if (node.type === "trigger") {
    return (
      <div className="space-y-4">
        <Label>Trigger event</Label>
        <select className={fieldClass()} value={node.data.event ?? ""} onChange={(e) => setData({ event: e.target.value as never })}>
          {EVENT_LIST.map((e) => (
            <option key={e.name} value={e.name}>
              {e.label}
            </option>
          ))}
        </select>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--body)" }}>
          The automation runs whenever this event fires anywhere in the platform (sign-ups, seminar registrations, seminar or course launches…).
        </p>
      </div>
    );
  }

  if (node.type === "condition") {
    return (
      <div className="space-y-4">
        <div>
          <Label>Payload field</Label>
          <select
            className={fieldClass()}
            value={node.data.field ?? ""}
            onChange={(e) => setData({ field: e.target.value })}
          >
            <option value="">— choose a field —</option>
            {eventFields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value="__custom__" disabled>
              (or type a custom path)
            </option>
          </select>
          {!eventFields.includes(node.data.field ?? "") && (node.data.field ?? "") !== "" && (
            <input
              className={`${fieldClass()} mt-1.5`}
              placeholder="custom.path.here"
              value={node.data.field ?? ""}
              onChange={(e) => setData({ field: e.target.value })}
            />
          )}
        </div>
        <div>
          <Label>Operator</Label>
          <select className={fieldClass()} value={node.data.operator ?? "equals"} onChange={(e) => setData({ operator: e.target.value as ConditionOperator })}>
            {OPERATORS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {!(node.data.operator === "exists" || node.data.operator === "not_exists") && (
          <div>
            <Label>Value</Label>
            <input
              className={fieldClass()}
              placeholder="e.g. paid"
              value={node.data.value ?? ""}
              onChange={(e) => setData({ value: e.target.value })}
            />
          </div>
        )}
        <div className="rounded-xl p-3 text-[12px] leading-relaxed" style={{ background: "var(--line)", color: "var(--body)" }}>
          The flow branches below: <b style={{ color: "var(--ink)" }}>YES</b> continues when the condition matches, <b style={{ color: "var(--ink)" }}>NO</b> when it doesn't.
        </div>
      </div>
    );
  }

  if (node.type === "action") {
    const actionType = node.data.actionType ?? "send_email";
    const setTo = (to: RecipientSetting) => setData({ to });
    return (
      <div className="space-y-4">
        <div>
          <Label>Action type</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(["send_email", "send_notification", "delay", "webhook"] as ActionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setData({ actionType: t })}
                className="rounded-xl border px-2 py-2 text-[11.5px] font-semibold transition"
                style={
                  actionType === t
                    ? { borderColor: "#6E4CFF", background: "#6E4CFF14", color: "#6E4CFF" }
                    : { borderColor: "var(--line)", color: "var(--body)" }
                }
              >
                {actionTypeLabel(t)}
              </button>
            ))}
          </div>
        </div>

        {actionType === "send_email" && (
          <>
            <div>
              <Label>Email template</Label>
              <div className="space-y-1.5">
                <select
                  className={fieldClass()}
                  value={node.data.templateId ?? ""}
                  onChange={(e) => {
                    const t = EMAIL_TEMPLATES.find((x) => x.id === e.target.value);
                    if (t) setData({ templateId: t.id, subject: t.subject });
                    if (e.target.value === "") setData({ templateId: "", subject: "" });
                  }}
                >
                  <option value="">— no template —</option>
                  {fitTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  {otherTemplates.length > 0 && (
                    <optgroup label="Other templates">
                      {otherTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--body)" }}>
                  Templates matching the automation's trigger event are listed first. The subject, message and design come
                  from the selected template.
                </p>
                {selectedTemplate && (
                  <div className="rounded-xl border p-3 text-[12px] leading-relaxed" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                    <span className="block font-semibold" style={{ color: "var(--ink)" }}>
                      {selectedTemplate.subject}
                    </span>
                    <span className="mt-1 block whitespace-pre-wrap">{selectedTemplate.previewBody}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Recipients</Label>
              <select
                className={fieldClass()}
                value={node.data.to?.mode ?? "path"}
                onChange={(e) => setTo({ mode: e.target.value as RecipientSetting["mode"], value: e.target.value === "role" ? "all" : e.target.value === "fixed" ? "" : node.data.to?.value ?? "user.email" })}
              >
                <option value="path">From event payload</option>
                <option value="fixed">Fixed email addresses</option>
                <option value="role">All registered users</option>
              </select>
            </div>
            <div>
              <Label>{node.data.to?.mode === "role" ? "Recipient group" : node.data.to?.mode === "fixed" ? "Email addresses (comma separated)" : "Payload path (e.g. user.email)"}</Label>
              <input
                className={fieldClass()}
                placeholder={node.data.to?.mode === "role" ? "all" : node.data.to?.mode === "fixed" ? "rahim@example.com, tanim@example.com" : "user.email"}
                value={node.data.to?.value ?? ""}
                onChange={(e) => setTo({ ...(node.data.to ?? { mode: "path" as const }), value: e.target.value })}
                disabled={node.data.to?.mode === "role"}
              />
              {node.data.to?.mode === "role" && (
                <p className="mt-1 text-[11.5px]" style={{ color: "var(--body)" }}>
                  Emails every user account (capped at 500).
                </p>
              )}
            </div>
          </>
        )}

        {actionType === "delay" && (
          <>
            <div>
              <Label>Duration</Label>
              <input
                type="number"
                min={1}
                className={fieldClass()}
                value={node.data.duration ?? 5}
                onChange={(e) => setData({ duration: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Unit</Label>
              <select
                className={fieldClass()}
                value={node.data.unit ?? "minutes"}
                onChange={(e) => setData({ unit: e.target.value as DelayUnit })}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
              </select>
            </div>
            <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--body)" }}>
              The flow pauses here before continuing. Maximum {MAX_DELAY_SECONDS / 60} minutes — the step runs inside
              the event request, so longer delays need a queue system.
            </p>
          </>
        )}

        {actionType === "send_notification" && (
          <>
            <div>
              <Label>Recipient roles</Label>
              <select
                className={fieldClass()}
                value={node.data.roles ?? "staff"}
                onChange={(e) => setData({ roles: e.target.value })}
              >
                <option value="staff">Admins + moderators</option>
                <option value="admin">Admins only</option>
                <option value="moderator">Moderators only</option>
                <option value="user">All users</option>
                <option value="admin,moderator,user">Everyone</option>
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <input
                className={fieldClass()}
                placeholder="New registration — {{user.name}}"
                value={node.data.title ?? ""}
                onChange={(e) => setData({ title: e.target.value })}
              />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className={`${fieldClass()} min-h-[90px] resize-y leading-relaxed`}
                placeholder='{{user.name}} registered for "{{seminar.title}}"'
                value={node.data.message ?? ""}
                onChange={(e) => setData({ message: e.target.value })}
              />
            </div>
          </>
        )}

        {actionType === "webhook" && (
          <>
            <div>
              <Label>Webhook URL</Label>
              <input
                className={fieldClass()}
                placeholder="https://example.com/hooks/lead"
                value={node.data.url ?? ""}
                onChange={(e) => setData({ url: e.target.value })}
              />
            </div>
            <div>
              <Label>Method</Label>
              <select className={fieldClass()} value={node.data.method ?? "POST"} onChange={(e) => setData({ method: e.target.value as "POST" | "GET" })}>
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>
            <div>
              <Label>Headers (JSON, optional)</Label>
              <input
                className={fieldClass()}
                placeholder='{"Authorization": "Bearer …"}'
                value={node.data.headers ?? ""}
                onChange={(e) => setData({ headers: e.target.value })}
              />
            </div>
            <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--body)" }}>
              The full event payload is posted as JSON: <code>{"{ event, payload }"}</code>.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <p className="text-[13px] leading-relaxed" style={{ color: "var(--body)" }}>
      The flow stops here. Add steps to the previous node to extend it.
    </p>
  );
}
