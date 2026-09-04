"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type ConfirmationProps = {
  preview: {
    title: string;
    description: string;
    details: Record<string, unknown>;
  };
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationCard({ preview, onConfirm, onCancel }: ConfirmationProps) {
  const isDestructive = preview.title.includes("DELETE") || preview.title.includes("Destructive");

  return (
    <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: isDestructive ? "#FCA5A5" : "var(--line)" }}>
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: isDestructive ? "rgba(239,68,68,0.08)" : "rgba(110,76,255,0.06)",
        }}
      >
        {isDestructive ? (
          <AlertTriangle size={14} style={{ color: "#DC2626" }} />
        ) : (
          <CheckCircle2 size={14} style={{ color: "#6E4CFF" }} />
        )}
        <span
          className="text-[12px] font-semibold"
          style={{ color: isDestructive ? "#DC2626" : "#6E4CFF" }}
        >
          {preview.title}
        </span>
      </div>

      <div className="px-3 py-2.5" style={{ background: "#fff" }}>
        <p className="text-[12.5px] mb-2" style={{ color: "var(--ink)" }}>
          {preview.description}
        </p>

        {Object.keys(preview.details).length > 0 && (
          <div className="rounded-lg p-2.5 text-[11px] font-mono" style={{ background: "var(--bg-soft)" }}>
            {Object.entries(preview.details).map(([key, value]) => (
              <div key={key} className="flex gap-2 py-0.5">
                <span className="font-semibold shrink-0" style={{ color: "var(--body)" }}>
                  {key}:
                </span>
                <span className="break-all" style={{ color: "var(--ink)" }}>
                  {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "")}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90"
            style={{ background: isDestructive ? "#DC2626" : "var(--brand)" }}
          >
            <CheckCircle2 size={12} />
            Confirm
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition hover:bg-black/5"
            style={{ borderColor: "var(--line)", color: "var(--body)" }}
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
