"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, BotMessageSquare, X } from "lucide-react";
import { ChatBody } from "./chat-body";

export function OpsBotWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Bridge Ops");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/bot-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data && typeof data.name === "string" && data.name) {
          setName(data.name);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end" ref={rootRef}>
      {open && (
        <div
          className="mb-3 flex w-[min(92vw,380px)] h-[min(62vh,540px)] flex-col overflow-hidden rounded-lg border"
          style={{
            borderColor: "var(--line)",
            background: "#fff",
            boxShadow: "0 30px 70px -25px rgba(18,32,67,0.38)",
          }}
        >
          <ChatBody
            variant="widget"
            renderToolbar={() => (
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: "#0E1530" }}>
                <span
                  className="relative flex w-9 h-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, var(--brand), #3B2BB0)" }}
                >
                  <Bot size={18} style={{ color: "#fff" }} />
                  <span
                    className="absolute -bottom-[1px] -right-[1px] w-3 h-3 rounded-full border-2"
                    style={{ background: "#2BD97E", borderColor: "#0E1530" }}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[14.5px] font-semibold text-white leading-tight">
                    {name}
                  </div>
                  <div
                    className="font-mono text-[10px] tracking-[0.18em] uppercase mt-[2px]"
                    style={{ color: "#8FD9B6" }}
                  >
                    Online — admin assistant
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex w-7 h-7 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/10"
                  aria-label="Close chat"
                >
                  <X size={16} style={{ color: "#fff" }} />
                </button>
              </div>
            )}
            renderEmpty={({ send }) => (
              <div className="flex flex-col gap-4 py-2">
                <div
                  className="max-w-[85%] rounded-lg rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-[1.6]"
                  style={{
                    background: "#fff",
                    color: "var(--ink)",
                    border: "1px solid var(--line)",
                  }}
                >
                  Ask {name} about users, orders, courses, seminars, or run admin actions.
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    "Give me a business overview",
                    "Show pending orders",
                    "List upcoming seminars",
                  ].map((q) => (
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
            )}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--brand), #3B2BB0)",
          boxShadow: "0 14px 34px -10px rgba(62,26,170,0.55)",
        }}
        aria-label={open ? "Close ops bot" : "Open ops bot"}
      >
        {!open && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "var(--brand)" }}
          />
        )}
        {open ? <X size={22} style={{ color: "#fff" }} /> : <BotMessageSquare size={22} style={{ color: "#fff" }} />}
      </button>
    </div>
  );
}