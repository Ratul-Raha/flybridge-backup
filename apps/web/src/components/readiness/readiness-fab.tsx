"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, X } from "lucide-react";
import { ReadinessWizard } from "./readiness-wizard";

export function ReadinessFab() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="fixed bottom-5 left-5 z-[70] flex flex-col items-start" ref={rootRef}>
      {open && (
        <div className="mb-3 fb-fab-panel flex w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border bg-white"
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
              <Compass size={18} className="text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[14.5px] font-semibold text-white leading-tight">
                Am I Ready?
              </div>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase mt-[2px]" style={{ color: "#8FD9B6" }}>
                Free AI assessment
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-7 h-7 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/10"
              aria-label="Close readiness widget"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          <div className="h-[min(60vh,480px)] overflow-y-auto" style={{ background: "var(--bg-soft)" }}>
            <div className="p-5">
              <ReadinessWizard compact />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2.5 rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 pl-[18px] pr-5 py-[14px]"
        style={{
          background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
          boxShadow: "0 14px 34px -10px rgba(15,169,104,0.55)",
        }}
        aria-label={open ? "Close readiness check" : "Open readiness check"}
      >
        {!open && (
          <span
            className="absolute inset-0 rounded-full fb-pulse"
            style={{ boxShadow: "0 0 0 0 rgba(15,169,104,0.45)" }}
          />
        )}
        <Compass size={20} className="text-white relative" />
        <span className="text-white text-[14px] font-semibold relative">Am I Ready?</span>
      </button>
    </div>
  );
}
