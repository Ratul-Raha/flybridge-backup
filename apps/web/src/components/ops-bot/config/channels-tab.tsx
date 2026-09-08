"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Send, Plus, Trash2, MessageCircle, X, AlertCircle } from "lucide-react";
import {
  SectionCard,
  PrimaryButton,
  GhostButton,
  Label,
  StatusPill,
  fieldClass,
} from "@/components/dashboard/automations/ui";

type TelegramConfig = {
  enabled: boolean;
  botToken: string;
  chatIds: string[];
  events: string[];
};

const DEFAULT_TELEGRAM: TelegramConfig = {
  enabled: false,
  botToken: "",
  chatIds: [],
  events: [],
};

const EVENT_GROUPS: { label: string; events: { name: string; label: string }[] }[] = [
  {
    label: "Users",
    events: [{ name: "user.registered", label: "User registered" }],
  },
  {
    label: "Seminars",
    events: [
      { name: "seminar.registration_created", label: "Seminar registration" },
      { name: "seminar.created", label: "Seminar created" },
      { name: "seminar.updated", label: "Seminar updated" },
      { name: "seminar.deleted", label: "Seminar deleted" },
    ],
  },
  {
    label: "Courses",
    events: [
      { name: "course.launched", label: "Course launched" },
      { name: "course.created", label: "Course created" },
      { name: "course.updated", label: "Course updated" },
      { name: "course.deleted", label: "Course deleted" },
      { name: "course.enrolled", label: "Course enrolled" },
    ],
  },
  {
    label: "Orders",
    events: [
      { name: "order.created", label: "Order created" },
      { name: "order.fulfilled", label: "Order fulfilled" },
    ],
  },
  {
    label: "Content",
    events: [
      { name: "resource.created", label: "Resource published" },
      { name: "scholarship.created", label: "Scholarship published" },
    ],
  },
];

const ALL_EVENTS = EVENT_GROUPS.flatMap((g) => g.events.map((e) => e.name));

export function ChannelsTab() {
  const [telegram, setTelegram] = useState<TelegramConfig>(DEFAULT_TELEGRAM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [newChatId, setNewChatId] = useState("");
  const [chatIdError, setChatIdError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bot-config")
      .then((r) => r.json())
      .then((data) => {
        const t = data.channels?.telegram;
        setTelegram({
          enabled: t?.enabled ?? false,
          botToken: t?.botToken ?? "",
          chatIds: t?.chatIds ?? [],
          events: t?.events ?? [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleEvent = (eventName: string) => {
    setTelegram((prev) => ({
      ...prev,
      events: prev.events.includes(eventName)
        ? prev.events.filter((e) => e !== eventName)
        : [...prev.events, eventName],
    }));
  };

  const toggleAll = () => {
    setTelegram((prev) => ({
      ...prev,
      events: prev.events.length === ALL_EVENTS.length ? [] : [...ALL_EVENTS],
    }));
  };

  const addChatId = () => {
    const id = newChatId.trim();
    if (!id) return;
    if (!/^-?\d+$/.test(id)) {
      setChatIdError(
        'Chat IDs are numeric only. Group & channel IDs usually start with "-" or "-100".',
      );
      return;
    }
    setChatIdError(null);
    setTelegram((prev) => ({
      ...prev,
      chatIds: prev.chatIds.includes(id) ? prev.chatIds : [...prev.chatIds, id],
    }));
    setNewChatId("");
  };

  const removeChatId = (id: string) => {
    setTelegram((prev) => ({
      ...prev,
      chatIds: prev.chatIds.filter((c) => c !== id),
    }));
  };

  const handleSave = async () => {
    const pendingId = newChatId.trim();
    if (pendingId && !/^-?\d+$/.test(pendingId)) {
      setChatIdError(
        'Chat IDs are numeric only. Group & channel IDs usually start with "-" or "-100".',
      );
      return;
    }
    setSaving(true);
    setSaved(false);
    setSavingError(null);
    const nextTelegram =
      pendingId && !telegram.chatIds.includes(pendingId)
        ? { ...telegram, chatIds: [...telegram.chatIds, pendingId] }
        : telegram;
    try {
      const res = await fetch("/api/admin/bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: { telegram: nextTelegram } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      if (pendingId && nextTelegram !== telegram) {
        setTelegram(nextTelegram);
        setNewChatId("");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSavingError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/bot-config/channels/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok && !Array.isArray(data.results)) throw new Error(data.error ?? "Test failed");
      const results: { chatId: string; ok: boolean; error?: string }[] = Array.isArray(data.results)
        ? data.results
        : [];
      if (!results.length) throw new Error("No response from server");
      const okCount = results.filter((r) => r.ok).length;
      if (okCount === 0) {
        const first = results[0]?.error ?? "Test failed";
        throw new Error(
          `${first}${results.length > 1 ? ` (also failed for ${results.length - 1} other chat(s))` : ""}`,
        );
      }
      const failed = results.filter((r) => !r.ok);
      const summary = failed.length
        ? `, but failed for ${failed.map((r) => r.chatId).join(", ")}`
        : "";
      setTestResult({
        ok: true,
        message: `Test message sent to ${okCount} chat${okCount > 1 ? "s" : ""}${summary}`,
      });
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <SectionCard title="Channels">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" />
          Loading channels...
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Telegram"
        subtitle="Forward system events to a Telegram bot for instant notifications"
        action={
          telegram.enabled ? (
            <StatusPill label="Active" color="#10B981" />
          ) : (
            <StatusPill label="Disabled" color="#F59E0B" />
          )
        }
      >
        {/* Enable toggle */}
        <div
          className="flex items-center justify-between gap-4 mb-5 rounded-lg border p-4"
          style={{ borderColor: "var(--line)" }}
        >
          <div>
            <p className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
              Enable Telegram notifications
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
              Send system event messages to configured Telegram chats
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={telegram.enabled}
            onClick={() => setTelegram((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className="relative w-[44px] h-[24px] shrink-0 rounded-full transition-colors"
            style={{
              background: telegram.enabled ? "#6E4CFF" : "#CBD5E1",
            }}
          >
            <span
              className="absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform"
              style={{ left: telegram.enabled ? "22px" : "2px" }}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <Label>Bot Token</Label>
            <div className="relative">
              <input
                type="password"
                value={telegram.botToken}
                onChange={(e) => setTelegram({ ...telegram, botToken: e.target.value })}
                className={fieldClass() + " pr-10 font-mono text-[12px]"}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                disabled={!telegram.enabled}
              />
              {telegram.botToken && (
                <button
                  type="button"
                  onClick={() => setTelegram({ ...telegram, botToken: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B93A7] hover:text-[#122043]"
                  aria-label="Clear token"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-[11.5px] mt-1.5" style={{ color: "var(--body)" }}>
              Get it from <span className="font-medium">@BotFather</span> on Telegram
            </p>
          </div>
          <div>
            <Label>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={11} />
                How to get your chat ID
              </span>
            </Label>
            <div
              className="rounded-lg border px-3 py-2.5 text-[12px] leading-relaxed"
              style={{ borderColor: "var(--line)", color: "var(--body)" }}
            >
              Message{" "}
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                @userinfobot
              </span>{" "}
              on Telegram, then copy your numeric chat ID below.{" "}
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                Important:
              </span>{" "}
              the recipient must have pressed{" "}
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                Start
              </span>{" "}
              on your bot (and the bot must be in the group) before you can message it — group &
              channel chat IDs usually start with{" "}
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                {"-"}
              </span>{" "}
              or{" "}
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                -100
              </span>
              .
            </div>
          </div>
        </div>

        {/* Chat IDs */}
        <div className="mb-5">
          <Label>Chat IDs</Label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newChatId}
              onChange={(e) => {
                setNewChatId(e.target.value);
                setChatIdError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChatId())}
              className={fieldClass()}
              placeholder="e.g. 123456789"
              disabled={!telegram.enabled}
            />
            <GhostButton onClick={addChatId} disabled={!telegram.enabled}>
              <Plus size={14} />
              Add
            </GhostButton>
          </div>
          {chatIdError && (
            <p className="text-[11.5px] mb-2 flex items-start gap-1" style={{ color: "#DC2626" }}>
              <AlertCircle size={12} className="mt-[2px] shrink-0" />
              {chatIdError}
            </p>
          )}
          {telegram.chatIds.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--body)" }}>
              No chat IDs added yet — notifications won&apos;t be sent until you add at least one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {telegram.chatIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium"
                  style={{
                    borderColor: "var(--line)",
                    color: "var(--ink)",
                    background: "var(--bg-soft, #F7F8FA)",
                  }}
                >
                  {id}
                  <button
                    type="button"
                    onClick={() => removeChatId(id)}
                    className="text-[#8B93A7] hover:text-[#DC2626] transition"
                    aria-label={`Remove ${id}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Event selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Events to notify</Label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] font-medium hover:underline"
              style={{ color: "var(--brand, #6E4CFF)" }}
            >
              {telegram.events.length === ALL_EVENTS.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EVENT_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-2">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--body)" }}
                >
                  {group.label}
                </p>
                {group.events.map((ev) => {
                  const checked = telegram.events.includes(ev.name);
                  return (
                    <label
                      key={ev.name}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition ${checked ? "" : "opacity-70"}`}
                      style={{
                        borderColor: checked ? "#6E4CFF" : "var(--line)",
                        background: checked ? "rgba(110,76,255,0.05)" : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(ev.name)}
                        disabled={!telegram.enabled}
                        className="accent-[#6E4CFF]"
                      />
                      <span className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                        {ev.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save Changes"}
        </PrimaryButton>
        <GhostButton onClick={handleTest} disabled={testing || !telegram.enabled} tone="#0EA5E9">
          {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {testing ? "Testing..." : "Send test message"}
        </GhostButton>
        {saved && (
          <span className="text-[12px] font-medium" style={{ color: "#059669" }}>
            Saved successfully
          </span>
        )}
        {savingError && (
          <span className="text-[12px] font-medium" style={{ color: "#DC2626" }}>
            {savingError}
          </span>
        )}
        {testResult && (
          <span
            className="text-[12px] font-medium"
            style={{ color: testResult.ok ? "#059669" : "#DC2626" }}
          >
            {testResult.message}
          </span>
        )}
      </div>
    </div>
  );
}
