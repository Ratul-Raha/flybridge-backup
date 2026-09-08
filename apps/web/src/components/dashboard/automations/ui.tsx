"use client";

import type { ReactNode } from "react";

export const ACCENT = "#6E4CFF";
export const EMERALD = "#10B981";
export const AMBER = "#F59E0B";
export const SKY = "#0EA5E9";
export const ROSE = "#F43F5E";

export function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-lg border bg-white p-[clamp(18px,2.5vw,26px)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: `${color}1A`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function fieldClass() {
  return "w-full rounded-xl border bg-white px-3 py-2 text-[13px] outline-none transition focus:ring-2 focus:ring-[#6E4CFF]/30 text-[#122043]";
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--body)" }}>
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: ACCENT }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  tone = "#122043",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ borderColor: "var(--line)", color: tone }}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(18,22,42,0.5)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-lg bg-white p-6"
        style={{ maxWidth: width, border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            {title}
          </h3>
          <button onClick={onClose} className="text-[#8B93A7] hover:text-[#122043] transition" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function timeAgo(value: string | Date) {
  const at = new Date(value).getTime();
  const diff = Date.now() - at;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}
