"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

type Seminar = {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  image: string | null;
  type: "free" | "paid";
  price: number;
  url: string | null;
  duration: string | null;
  registrations: number;
};

function formatDateTime(iso: string) {
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

export function SeminarList() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Seminar | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/seminars", { cache: "no-store" });
      const data = await res.json();
      setSeminars(data.seminars ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load seminars");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openRegister = (s: Seminar) => {
    setError(null);
    setMessage(null);
    setPhone(user?.phone ?? "");
    setPhoneError(null);
    setSelected(s);
  };

  const register = useCallback(
    async (email: string) => {
      if (!selected) return false;
      const value = phone.trim();
      if (!value) {
        setPhoneError("Phone number is required");
        return false;
      }
      setPhoneError(null);
      setSubmitting(true);
      try {
        const res = await fetch(`/api/seminars/${selected.id}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phone: value }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Registration failed");
        setMessage(
          data.alreadyRegistered
            ? `You're already registered for "${selected.title}".`
            : `You're registered for "${selected.title}". A confirmation email is on its way to ${email}.`
        );
        load();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Registration failed");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [selected, phone, load]
  );

  const redirectToSeminar = () => {
    if (selected) router.push(`/dashboard/seminars/mine/${selected.id}`);
  };

  const registerWithGoogle = async () => {
    setError(null);
    setMessage(null);
    if (!selected) return;
    if (user) {
      const ok = await register(user.email);
      if (ok && user.accountType === "user") redirectToSeminar();
      return;
    }
    const email = await signInWithGoogle();
    if (!email) return;
    const ok = await register(email);
    if (ok) redirectToSeminar();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-[13.5px]" style={{ color: "var(--body)" }}>
          Loading seminars…
        </span>
      </div>
    );
  }

  const now = new Date();
  const upcoming = seminars.filter((s) => new Date(s.dateTime) >= now);
  const recent = seminars.filter((s) => new Date(s.dateTime) < now);

  const renderCard = (s: Seminar, isUpcoming: boolean) => (
    <article
      key={s.id}
      className="rounded-[24px] border bg-white overflow-hidden flex flex-col"
      style={{ borderColor: "var(--line)" }}
    >
      {s.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt={s.title} className="w-full h-[170px] object-cover" />
      ) : (
        <div
          className="w-full h-[170px] flex items-center justify-center font-display text-[15px] text-white"
          style={{
            background:
              s.type === "paid"
                ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                : "linear-gradient(135deg,#0FA968,#18A97A)",
          }}
        >
          FlyBridge Seminar
        </div>
      )}

      <div className="flex flex-col gap-3 p-6 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
            style={
              s.type === "paid"
                ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                : { background: "var(--brand-soft)", color: "var(--brand)" }
            }
          >
            {s.type === "paid" ? `Paid${s.price ? ` · $${s.price}` : ""}` : "Free"}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.08em]"
            style={{ color: isUpcoming ? "var(--brand)" : "var(--body)" }}
          >
            {isUpcoming ? "Upcoming" : "Completed"}
          </span>
        </div>

        <h3 className="font-display text-[18px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
          {s.title}
        </h3>

        <p className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
          📅 {formatDateTime(s.dateTime)}
        </p>

        {s.description && (
          <p className="text-[13.5px] leading-[1.6] line-clamp-3" style={{ color: "var(--body)" }}>
            {s.description}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            <Users className="w-[14px] h-[14px]" style={{ color: "var(--brand)" }} />
            {s.registrations} joined
          </span>
          {isUpcoming ? (
            <button
              type="button"
              onClick={() => openRegister(s)}
              className="rounded-full text-white text-[13px] font-medium px-5 py-[9px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              Register with Gmail
            </button>
          ) : (
            <span className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
              Session ended
            </span>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div>
      {error && (
        <div
          className="text-[12.5px] rounded-xl border px-4 py-3 mb-6"
          style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}
        >
          {error}
        </div>
      )}

      {seminars.length === 0 ? (
        <p className="text-[14px] py-16 text-center" style={{ color: "var(--body)" }}>
          No seminars right now. Check back soon!
        </p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-16">
              <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
                <div>
                  <h2
                    className="font-display font-semibold tracking-[-0.01em]"
                    style={{ fontSize: "clamp(22px,2.4vw,28px)", color: "var(--ink)" }}
                  >
                    Upcoming seminars
                  </h2>
                  <p className="text-[14px] mt-1.5" style={{ color: "var(--body)" }}>
                    Book your spot before the seats fill up.
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                {upcoming.map((s) => renderCard(s, true))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
                <div>
                  <h2
                    className="font-display font-semibold tracking-[-0.01em]"
                    style={{ fontSize: "clamp(22px,2.4vw,28px)", color: "var(--ink)" }}
                  >
                    Recent seminars
                  </h2>
                  <p className="text-[14px] mt-1.5" style={{ color: "var(--body)" }}>
                    Past sessions — see who joined and what was covered.
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                {recent.map((s) => renderCard(s, false))}
              </div>
            </section>
          )}
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(10,20,45,0.5)" }}
          onClick={() => !submitting && setSelected(null)}
        >
          <div
            className="w-full max-w-[440px] rounded-[24px] bg-white p-[clamp(22px,4vw,32px)]"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "0 32px 80px -24px rgba(18,32,67,0.4)" }}
          >
            <h3 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
              Register for seminar
            </h3>
            <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
              {selected.title} · {formatDateTime(selected.dateTime)}
            </p>

            {message ? (
              <div className="mt-6 text-[14px] leading-[1.6]" style={{ color: "var(--brand)" }}>
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
                  <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60"
                    style={{
                      borderColor: phoneError ? "rgba(192,57,43,0.5)" : "var(--line)",
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
                  {submitting
                    ? "Registering…"
                    : "Register with Gmail"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}