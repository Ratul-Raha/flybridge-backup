"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";
import { ConfirmationCard } from "./confirmation-card";
import { ToolCallDisplay } from "./tool-call-display";

type ChatRole = "user" | "assistant";

type ToolCallInfo = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

type ConfirmationInfo = {
  auditLogId: string;
  preview: {
    title: string;
    description: string;
    details: Record<string, unknown>;
  };
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls?: ToolCallInfo[];
  confirmation?: ConfirmationInfo;
  toolResult?: { toolId: string; success: boolean; data?: unknown; error?: string };
  pending?: boolean;
};

type StreamEvent = {
  type: "text" | "tool_call" | "confirmation" | "tool_result" | "done" | "error";
  text?: string;
  toolCall?: ToolCallInfo;
  auditLogId?: string;
  preview?: ConfirmationInfo["preview"];
  toolId?: string;
  result?: { success: boolean; data?: unknown; error?: string };
  conversationId?: string;
  error?: string;
};

const QUICK_STARTERS = [
  "Give me a business overview",
  "Show pending orders",
  "List upcoming seminars",
  "Which courses are most popular?",
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded font-mono text-[12px]" style="background:var(--bg-soft);color:var(--ink)">$1</code>')
    .replace(/\n/g, "<br/>");
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[6px] h-[6px] rounded-full animate-bounce"
          style={{
            background: "var(--brand)",
            opacity: 0.45,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function OpsBotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(scrollToBottom, 120);
    return () => clearInterval(interval);
  }, [streaming, scrollToBottom]);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || streaming) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        pending: true,
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
      setError(null);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/admin/ops-bot", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationId,
          }),
        });

        if (!res.ok) {
          let detail = "Something went wrong";
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) detail = data.error;
          } catch {
            // keep default
          }
          throw new Error(detail);
        }

        if (!res.body) throw new Error("No response stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            for (const line of event.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                const parsed = JSON.parse(line.slice(6)) as StreamEvent;

                if (parsed.type === "text" && parsed.text) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsg.id
                        ? { ...m, content: m.content + parsed.text }
                        : m
                    )
                  );
                }

                if (parsed.type === "tool_call" && parsed.toolCall) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsg.id
                        ? {
                            ...m,
                            toolCalls: [...(m.toolCalls ?? []), parsed.toolCall!],
                          }
                        : m
                    )
                  );
                }

                if (parsed.type === "confirmation" && parsed.auditLogId && parsed.preview) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsg.id
                        ? {
                            ...m,
                            confirmation: {
                              auditLogId: parsed.auditLogId!,
                              preview: parsed.preview!,
                            },
                            pending: false,
                          }
                        : m
                    )
                  );
                }

                if (parsed.type === "tool_result" && parsed.toolId) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsg.id
                        ? {
                            ...m,
                            toolResult: {
                              toolId: parsed.toolId!,
                              success: parsed.result?.success ?? false,
                              data: parsed.result?.data,
                              error: parsed.result?.error,
                            },
                          }
                        : m
                    )
                  );
                }

                if (parsed.type === "done" && parsed.conversationId) {
                  setConversationId(parsed.conversationId);
                }

                if (parsed.type === "error") {
                  setError(parsed.error ?? "Stream error");
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsg.id ? { ...m, pending: false } : m))
        );
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, streaming, conversationId]
  );

  const handleConfirm = useCallback(
    async (auditLogId: string) => {
      setStreaming(true);
      try {
        const res = await fetch("/api/admin/ops-bot?action=confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auditLogId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Confirmation failed");

        setMessages((prev) =>
          prev.map((m) =>
            m.confirmation?.auditLogId === auditLogId
              ? { ...m, confirmation: undefined, toolResult: { toolId: "confirmed", success: true, data: data.data } }
              : m
          )
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Confirmation failed");
      } finally {
        setStreaming(false);
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-t-2xl border"
        style={{ background: "var(--ink)", borderColor: "var(--ink)" }}
      >
        <span
          className="relative flex w-10 h-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--brand)" }}
        >
          <Bot size={20} style={{ color: "#fff" }} />
          <span
            className="absolute -bottom-[1px] -right-[1px] w-3 h-3 rounded-full border-2"
            style={{ background: "#2BD97E", borderColor: "var(--ink)" }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] font-semibold text-white leading-tight">
            Bridge Ops
          </div>
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase mt-[2px]" style={{ color: "#8FD9B6" }}>
            Online — admin assistant
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setConversationId(null);
          }}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4"
        style={{ background: "var(--bg-soft)" }}
      >
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div
              className="flex w-16 h-16 items-center justify-center rounded-full"
              style={{ background: "var(--brand-soft)" }}
            >
              <Bot size={28} style={{ color: "var(--brand)" }} />
            </div>
            <div className="text-center">
              <h2 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
                Bridge Ops
              </h2>
              <p className="text-[13px] mt-1 max-w-[320px]" style={{ color: "var(--body)" }}>
                Your AI admin assistant. Ask me about users, orders, courses, seminars, or anything about your business.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-[480px]">
              {QUICK_STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-[12.5px] font-medium rounded-full px-4 py-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-[1.65] break-words ${
                  m.role === "user"
                    ? "rounded-tr-sm text-white"
                    : "rounded-tl-sm"
                }`}
                style={
                  m.role === "user"
                    ? { background: "var(--brand)", color: "#fff" }
                    : { background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }
                }
              >
                {m.role === "assistant" && m.pending && !m.content && !m.toolCalls?.length ? (
                  <TypingDots />
                ) : (
                  <>
                    {m.content && (
                      <span
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                      />
                    )}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {m.toolCalls.map((tc) => (
                          <ToolCallDisplay key={tc.id} toolCall={tc} />
                        ))}
                      </div>
                    )}
                    {m.toolResult && !m.confirmation && (
                      <div
                        className="mt-2 flex items-center gap-2 text-[12px] font-medium rounded-lg px-3 py-2"
                        style={{
                          background: m.toolResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: m.toolResult.success ? "#059669" : "#DC2626",
                        }}
                      >
                        {m.toolResult.success ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        {m.toolResult.success
                          ? `${m.toolResult.toolId} completed`
                          : `Error: ${m.toolResult.error}`}
                      </div>
                    )}
                    {m.confirmation && (
                      <ConfirmationCard
                        preview={m.confirmation.preview}
                        onConfirm={() => handleConfirm(m.confirmation!.auditLogId)}
                        onCancel={() =>
                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === m.id ? { ...msg, confirmation: undefined } : msg
                            )
                          )
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t px-5 py-4" style={{ borderColor: "var(--line)", background: "#fff" }}>
        {error && (
          <div className="mb-2 text-[12px] flex items-center gap-1.5" style={{ color: "#C0392B" }}>
            <AlertTriangle size={13} />
            {error}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask about users, orders, courses, seminars…"
            className="max-h-28 flex-1 resize-none rounded-xl border px-4 py-3 text-[13px] leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#6E4CFF]/30"
            style={{ borderColor: "var(--line)", background: "var(--bg-soft)", color: "var(--ink)" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-40"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.12em] uppercase" style={{ color: "#A6ADC0" }}>
          <Sparkles size={10} />
          AI-powered admin assistant with database access
        </div>
      </div>
    </div>
  );
}
