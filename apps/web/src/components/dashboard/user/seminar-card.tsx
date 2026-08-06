"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, UserPlus, Loader2, Users } from "lucide-react";
import { formatDateTime, type DashboardSeminar } from "./seminar-types";
import { useAuth } from "@/lib/auth/auth-context";

export function SeminarCard({
  seminar,
  registered = false,
  onRegistered,
}: {
  seminar: DashboardSeminar;
  registered?: boolean;
  onRegistered?: (id: string) => void;
}) {
  const { user } = useAuth();
  const upcoming = new Date(seminar.dateTime) >= new Date();

  const [isRegistered, setIsRegistered] = useState(registered);
  const [busy, setBusy] = useState(false);
  const [needPhone, setNeedPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    const p = (phone || user?.phone || "").trim();
    if (!p) {
      setNeedPhone(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/seminars/${seminar.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user?.name, email: user?.email, phone: p }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setIsRegistered(true);
      setNeedPhone(false);
      onRegistered?.(seminar.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className="rounded-[14px] border bg-white overflow-hidden flex flex-col"
      style={{ borderColor: "var(--line)" }}
    >
      {seminar.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={seminar.image}
          alt={seminar.title}
          className="w-full h-[150px] object-cover"
        />
      ) : (
        <div
          className="w-full h-[150px] flex items-center justify-center font-display text-[14px] text-white"
          style={{
            background:
              seminar.type === "paid"
                ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                : "linear-gradient(135deg,#0FA968,#18A97A)",
          }}
        >
          FlyBridge Seminar
        </div>
      )}

      <div className="flex flex-col gap-2.5 p-5 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
            style={
              seminar.type === "paid"
                ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                : { background: "var(--brand-soft)", color: "var(--brand)" }
            }
          >
            {seminar.type === "paid" ? `Paid${seminar.price ? ` · $${seminar.price}` : ""}` : "Free"}
          </span>
          {isRegistered ? (
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px] inline-flex items-center gap-1"
              style={{ background: "rgba(15,169,104,0.12)", color: "#0FA968" }}
            >
              <CheckCircle2 size={11} /> Registered
            </span>
          ) : (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.08em]"
              style={{ color: upcoming ? "var(--brand)" : "var(--body)" }}
            >
              {upcoming ? "Upcoming" : "Completed"}
            </span>
          )}
        </div>

        <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
          {seminar.title}
        </h3>

        <p
          className="text-[12px] font-medium flex items-center gap-1.5"
          style={{ color: "var(--body)" }}
        >
          <CalendarDays size={13} />
          {formatDateTime(seminar.dateTime)}
        </p>

        {seminar.description && (
          <p className="text-[13px] leading-[1.6] line-clamp-2" style={{ color: "var(--body)" }}>
            {seminar.description}
          </p>
        )}

        {typeof seminar.registrations === "number" && (
          <p
            className="mt-auto pt-2 text-[12px] font-semibold flex items-center gap-1.5"
            style={{ color: "var(--ink)" }}
          >
            <Users size={13} style={{ color: "var(--brand)" }} />
            {seminar.registrations} joined
          </p>
        )}

        {/* Register */}
        {upcoming && !isRegistered && (
          <div className="mt-auto pt-3 flex flex-col gap-2">
            {needPhone && (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                    className="flex-1 min-w-0 text-[13px] rounded-[10px] border bg-white px-3 py-[9px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                  <button
                    type="button"
                    onClick={register}
                    disabled={busy}
                    className="rounded-[10px] px-3.5 py-[9px] text-[12.5px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                    style={{ background: "var(--brand)" }}
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : "Confirm"}
                  </button>
                </div>
                <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  Add your phone to complete registration.
                </p>
              </div>
            )}

            {!needPhone && (
              <button
                type="button"
                onClick={register}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-[9px] text-[12.5px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--brand)" }}
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                {busy ? "Registering…" : "Register now"}
              </button>
            )}

            {error && (
              <p
                className="text-[11.5px] rounded-lg px-3 py-2"
                style={{
                  color: "#C0392B",
                  background: "rgba(192,57,43,0.06)",
                  border: "1px solid rgba(192,57,43,0.2)",
                }}
              >
                {error}
              </p>
            )}
          </div>
        )}

        {isRegistered && seminar.url && (
          <a
            href={seminar.url}
            target="_blank"
            rel="noreferrer"
            className="mt-auto pt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-[9px] text-[12.5px] font-semibold transition-colors duration-200 hover:bg-[var(--brand-soft)]"
            style={{ borderColor: "var(--line)", color: "var(--brand)" }}
          >
            Join session
          </a>
        )}
      </div>
    </article>
  );
}
