"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { requiresPhone } from "@/lib/phone-requirement";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { PhoneInput } from "@/components/phone-input";

export function PhoneRequiredModal() {
  const { user, refreshSession, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loggingOut = useRef(false);

  const exemptPath =
    pathname === "/complete-profile" ||
    pathname === "/login" ||
    pathname === "/logout";
  const required =
    !!user && !exemptPath && requiresPhone(user.accountType, user.phone);

  const handleLogout = useCallback(async () => {
    if (loggingOut.current || submitting) return;
    loggingOut.current = true;
    await signOut();
    router.replace("/login");
  }, [signOut, router, submitting]);

  useEffect(() => {
    if (!required) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [required]);

  useEffect(() => {
    if (!required) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (document.querySelector('[role="listbox"]')) return;
      e.preventDefault();
      void handleLogout();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [required, handleLogout]);

  if (!required) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      setError("Please enter a valid phone number for your selected country");
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save phone number");
      }
      await refreshSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save phone number");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-required-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => void handleLogout()}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[440px] rounded-2xl border bg-white p-[clamp(24px,5vw,36px)] shadow-2xl"
        style={{ borderColor: "var(--line)" }}
      >
        <h2
          id="phone-required-title"
          className="font-display text-[22px] font-semibold tracking-[-0.02em] text-center"
          style={{ color: "var(--ink)" }}
        >
          Phone number required
        </h2>
        <p
          className="text-center text-[13px] leading-[1.6] mt-2 mb-6"
          style={{ color: "var(--body)" }}
        >
          A valid phone number is required to continue using your account.
          Closing this window will sign you out.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="phone-required-input"
              className="text-[12.5px] font-medium"
              style={{ color: "var(--ink)" }}
            >
              Phone number
            </label>
            <PhoneInput
              id="phone-required-input"
              value={phone}
              onChange={setPhone}
              placeholder="1XXX XXXXXXX"
              disabled={submitting}
              inputClassName="w-full text-[14px] border bg-white px-4 py-[11px] rounded-r-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60"
              inputStyle={{ color: "var(--ink)" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-brand-2 px-4 py-[11px] text-[13.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Saving…" : "Save & continue"}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleLogout()}
            className="text-[12.5px] font-medium underline underline-offset-2 disabled:opacity-60"
            style={{ color: "var(--body)" }}
          >
            Sign out instead
          </button>
        </form>

        {error && (
          <div
            className="text-[12.5px] rounded-xl border px-4 py-3 mt-4"
            style={{
              color: "#C0392B",
              borderColor: "rgba(192,57,43,0.25)",
              background: "rgba(192,57,43,0.06)",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
