"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { isValidBdPhone, normalizeBdPhone } from "@/lib/phone";

export function PhoneCapture({ next }: { next: string }) {
  const [phone, setPhone] = useState("+8801");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.phone && isValidBdPhone(user.phone)) {
      router.replace(next);
    }
  }, [user, router, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizeBdPhone(phone);
    if (!isValidBdPhone(normalized)) {
      setError("Please enter a valid Bangladeshi phone number (e.g., +8801XXXXXXXXX)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save phone number");
      }
      await refreshSession();
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save phone number");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1
        className="font-display text-[26px] font-semibold tracking-[-0.02em] text-center"
        style={{ color: "var(--ink)" }}
      >
        Complete your profile
      </h1>
      <p
        className="text-center text-[13.5px] leading-[1.6] mt-2 mb-8"
        style={{ color: "var(--body)" }}
      >
        A valid phone number is required to continue. For now, we only support Bangladeshi numbers (+88).
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+8801XXXXXXXXX"
            className="w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
          <p className="text-[11px]" style={{ color: "var(--body)" }}>
            Country code locked to +88 for Bangladesh
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2.5 rounded-xl border px-4 py-[11px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2/60 hover:bg-brand-soft/50 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : null}
          {submitting ? "Saving…" : "Continue"}
        </button>
      </form>

      {error && (
        <div
          className="text-[12.5px] rounded-xl border px-4 py-3 mb-6"
          style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
