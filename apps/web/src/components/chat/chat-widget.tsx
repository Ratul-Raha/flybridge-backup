"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
};

type StreamEvent = {
  text?: string;
  done?: boolean;
};

const QUICK_QUESTIONS = [
  "What programs do you offer?",
  "How do I register for a seminar?",
  "What is the Student Visa Blueprint?",
  "How do I access my dashboard?",
];

const WELCOME =
  "Hi! I'm Bridge, the FlyBridge support bot. Ask me anything about our programs, seminars, or your account.";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderRich(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline font-medium" style="color:var(--brand-2)">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="px-[5px] py-[1px] rounded-[6px] font-mono text-[12px]" style="background:var(--bg-soft);color:var(--ink)">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[6px] h-[6px] rounded-full fb-bounce"
          style={{
            background: "var(--body)",
            opacity: 0.45,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [open, messages, scrollToBottom]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(scrollToBottom, 120);
    return () => clearInterval(interval);
  }, [streaming, scrollToBottom]);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || streaming) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
      const botMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", pending: true };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
      setError(null);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.filter((m) => !m.pending),
              userMsg,
            ].map(({ role, content }) => ({ role, content })),
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
              const parsed = JSON.parse(line.slice(6)) as StreamEvent;
              if (parsed.text) {
                const delta = parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsg.id ? { ...m, content: m.content + delta } : m
                  )
                );
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
    [input, messages, streaming]
  );

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end" ref={rootRef}>
      {open && (
        <div
          className="mb-3 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border bg-white"
          style={{
            borderColor: "var(--line)",
            boxShadow: "0 30px 70px -25px rgba(18,32,67,0.38)",
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ background: "var(--ink)" }}
          >
            <span
              className="relative flex w-9 h-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--brand)" }}
            >
              <Bot size={18} style={{ color: "#fff" }} />
              <span
                className="absolute -bottom-[1px] -right-[1px] w-3 h-3 rounded-full border-2"
                style={{ background: "#2BD97E", borderColor: "var(--ink)" }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[14.5px] font-semibold text-white leading-tight">
                Bridge · FlyBridge Support
              </div>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase mt-[2px]" style={{ color: "#8FD9B6" }}>
                Online — knowledge base
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-7 h-7 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/10"
              aria-label="Close chat"
            >
              <X size={16} style={{ color: "#fff" }} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex h-[min(52vh,420px)] flex-col gap-3 overflow-y-auto px-4 py-4"
            style={{ background: "var(--bg-soft)" }}
          >
            {messages.length === 0 && !streaming ? (
              <div>
                <div
                  className="max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-[1.6]"
                  style={{ background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}
                >
                  {WELCOME}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="text-left text-[12.5px] font-medium rounded-full px-3.5 py-2 transition-colors duration-200 hover:opacity-90"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-[1.6] text-white whitespace-pre-wrap break-words"
                      style={{ background: "var(--brand)", color: "#fff" }}
                    >
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className="max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-[1.6] break-words"
                      style={{ background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}
                    >
                      {m.pending && !m.content ? (
                        <TypingDots />
                      ) : m.content ? (
                        <span dangerouslySetInnerHTML={{ __html: renderRich(m.content) }} />
                      ) : null}
                    </div>
                  </div>
                )
              )
            )}
          </div>

          <div className="border-t px-3.5 py-3" style={{ borderColor: "var(--line)", background: "#fff" }}>
            {error && (
              <div className="mb-2 text-[12px]" style={{ color: "#C0392B" }}>
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
                placeholder="Ask about programs, seminars…"
                aria-label="Message the support bot"
                className="max-h-24 flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-[13px] leading-[1.5] focus:outline-none"
                style={{ borderColor: "var(--line)", background: "var(--bg-soft)", color: "var(--ink)" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-40"
                style={{ background: "var(--brand)", color: "#fff" }}
                aria-label={streaming ? "Sending message" : "Send message"}
              >
                {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.12em] uppercase" style={{ color: "#A6ADC0" }}>
              <Sparkles size={10} />
              Answers from the FlyBridge knowledge base
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
          boxShadow: "0 14px 34px -10px rgba(15,169,104,0.55)",
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {!open && (
          <span
            className="absolute inset-0 rounded-full fb-pulse"
            style={{ boxShadow: "0 0 0 0 rgba(15,169,104,0.45)" }}
          />
        )}
        {open ? (
          <X size={22} style={{ color: "#fff" }} />
        ) : (
          <MessageCircle size={22} style={{ color: "#fff" }} />
        )}
      </button>
    </div>
  );
}
