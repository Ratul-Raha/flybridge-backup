"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { PaymentMethodPicker, defaultCheckoutCurrency, type PickableCurrency } from "@/components/payment/payment-method-picker";

export type SeminarLike = {
  id: string;
  title: string;
  dateTime: string;
  type?: "free" | "paid";
  price?: number;
  prices?: { USD?: number; BDT?: number } | null;
};

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SeminarRegisterModal({
  seminar,
  onClose,
  onRegistered,
}: {
  seminar: SeminarLike;
  onClose: () => void;
  onRegistered: (seminar: SeminarLike) => void;
}) {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currency, setCurrency] = useState<PickableCurrency>(
    defaultCheckoutCurrency(seminar.prices)
  );
  const isPaid = seminar.type === "paid";

  const register = useCallback(
    async (email: string): Promise<"registered" | "paying" | false> => {
      const value = phone.trim();
      if (!value) {
        setPhoneError("Phone number is required");
        return false;
      }
      setPhoneError(null);
      setSubmitting(true);
      try {
        const res = await fetch(`/api/seminars/${seminar.id}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phone: value, currency }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Registration failed");
        if (data.requiresPayment && data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return "paying";
        }
        setMessage(
          data.alreadyRegistered
            ? `You're already registered for "${seminar.title}".`
            : `You're registered for "${seminar.title}". A confirmation email is on its way to ${email}.`
        );
        onRegistered(seminar);
        return "registered";
      } catch (e) {
        setError(e instanceof Error ? e.message : "Registration failed");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [seminar, phone, onRegistered, currency]
  );

  const registerWithGoogle = async () => {
    setError(null);
    setMessage(null);
    if (user) {
      const status = await register(user.email);
      if (status === "registered" && user.accountType === "user") {
        router.push(`/dashboard/seminars/mine/${seminar.id}`);
      }
      return;
    }
    const email = await signInWithGoogle("seminar");
    if (!email) return;
    const status = await register(email);
    if (status === "registered") router.push(`/dashboard/seminars/mine/${seminar.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(10,20,45,0.5)" }}
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-[440px] rounded-[24px] bg-white p-[clamp(22px,4vw,32px)]"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 32px 80px -24px rgba(18,32,67,0.4)" }}
      >
        <h3
          className="font-display text-[18px] font-semibold"
          style={{ color: "var(--ink)" }}
        >
          Register for seminar
        </h3>
        <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
          {seminar.title} · {formatDateTime(seminar.dateTime)}
        </p>

        {message ? (
          <div
            className="mt-6 text-[14px] leading-[1.6]"
            style={{ color: "var(--brand)" }}
          >
            {message}
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-6">
            {error && (
              <p className="text-[12.5px]" style={{ color: "#C0392B" }}>
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <label
                className="text-[12.5px] font-medium"
                style={{ color: "var(--ink)" }}
              >
                Phone number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60"
                style={{
                  borderColor: phoneError
                    ? "rgba(192,57,43,0.5)"
                    : "var(--line)",
                  color: "var(--ink)",
                }}
              />
              {phoneError && (
                <p className="text-[12px]" style={{ color: "#C0392B" }}>
                  {phoneError}
                </p>
              )}
            </div>

            <div
              className="rounded-xl px-4 py-3 text-[12.5px] leading-[1.6]"
              style={{ background: "var(--bg-soft)", color: "var(--body)" }}
            >
              {user
                ? `Registered as ${user.email} — your FlyBridge account is linked automatically.`
                : "Sign in with Gmail to register. Your FlyBridge account is created automatically."}
            </div>

            {isPaid && (
              <div>
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                  Payment method
                </p>
                <PaymentMethodPicker
                  prices={seminar.prices}
                  value={currency}
                  onChange={setCurrency}
                />
              </div>
            )}

            <button
              type="button"
              onClick={registerWithGoogle}
              disabled={submitting}
              className="flex items-center justify-center gap-2.5 rounded-full text-white text-[14px] font-medium py-[13px] mt-1 transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#fff" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {submitting ? "Registering…" : "Register with Gmail"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}