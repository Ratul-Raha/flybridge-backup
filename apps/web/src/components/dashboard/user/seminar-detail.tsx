"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  Users,
  Video,
} from "lucide-react";
import { formatDateTime } from "./seminar-types";
import { EmptyState, ScreenError, ScreenLoading } from "./ui";

type SeminarDetailData = {
  seminar: {
    id: string;
    title: string;
    description: string | null;
    dateTime: string;
    image: string | null;
    type: "free" | "paid";
    price: number;
    url: string | null;
    duration: string | null;
    registrations: number;
  };
  registration: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
    registeredAt: string;
  };
};

export function SeminarDetail({ seminarId }: { seminarId: string }) {
  const [data, setData] = useState<SeminarDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/me/seminars/${seminarId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load seminar");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load seminar");
    } finally {
      setLoading(false);
    }
  }, [seminarId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ScreenLoading label="Loading seminar…" />;
  if (error) return <ScreenError message={error} />;
  if (!data) return null;

  const { seminar: s, registration: reg } = data;
  const upcoming = new Date(s.dateTime) >= new Date();

  return (
    <div className="max-w-[860px] mx-auto flex flex-col gap-6">
      <Link
        href="/dashboard/seminars/mine"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-200 hover:text-brand-2"
        style={{ color: "var(--brand)" }}
      >
        <ArrowLeft size={14} /> Back to my seminars
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
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
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px] inline-flex items-center gap-1"
              style={{ background: "rgba(15,169,104,0.12)", color: "#0FA968" }}
            >
              <CheckCircle2 size={11} /> Registered
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.08em]"
              style={{ color: upcoming ? "var(--brand)" : "var(--body)" }}
            >
              {upcoming ? "Upcoming" : "Completed"}
            </span>
          </div>
          <h1
            className="font-display text-[clamp(22px,3vw,30px)] font-semibold leading-[1.2] tracking-[-0.02em] mt-3"
            style={{ color: "var(--ink)" }}
          >
            {s.title}
          </h1>
        </div>
        {upcoming && s.url && (
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Video size={15} /> Join session
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div
        className="rounded-[24px] border bg-white overflow-hidden"
        style={{
          borderColor: "var(--line)",
          boxShadow: "0 20px 50px -32px rgba(18,32,67,0.25)",
        }}
      >
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt={s.title} className="w-full h-[220px] object-cover" />
        ) : (
          <div
            className="w-full h-[220px] flex items-center justify-center font-display text-[16px] text-white"
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

        <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-soft)" }}
              >
                <CalendarDays size={17} style={{ color: "var(--brand)" }} />
              </span>
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                  Date &amp; time
                </div>
                <div className="text-[14px] font-semibold mt-[2px]" style={{ color: "var(--ink)" }}>
                  {formatDateTime(s.dateTime)}
                </div>
              </div>
            </div>

            {s.duration && (
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <Clock size={17} style={{ color: "var(--brand)" }} />
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                    Duration
                  </div>
                  <div className="text-[14px] font-semibold mt-[2px]" style={{ color: "var(--ink)" }}>
                    {s.duration}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-soft)" }}
              >
                <Users size={17} style={{ color: "var(--brand)" }} />
              </span>
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                  Registrations
                </div>
                <div className="text-[14px] font-semibold mt-[2px]" style={{ color: "var(--ink)" }}>
                  {s.registrations} joined
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {reg.phone && (
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <Phone size={17} style={{ color: "var(--brand)" }} />
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                    Phone on file
                  </div>
                  <div className="text-[14px] font-semibold mt-[2px]" style={{ color: "var(--ink)" }}>
                    {reg.phone}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border px-5 py-4" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                Registration confirmed
              </div>
              <div className="text-[13.5px] font-medium mt-1.5" style={{ color: "var(--ink)" }}>
                {reg.name} · {reg.email}
              </div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
                Registered on {new Date(reg.registeredAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>

        {s.description && (
          <div
            className="px-6 sm:px-8 pb-8 text-[14.5px] leading-[1.75]"
            style={{ color: "var(--body)" }}
          >
            {s.description}
          </div>
        )}
      </div>

      {!upcoming && (
        <EmptyState
          title="This session is complete"
          desc="You were registered for a past session. Browse upcoming seminars to keep learning."
          action={
            <Link
              href="/dashboard/seminars"
              className="inline-block rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              Browse seminars
            </Link>
          }
        />
      )}
    </div>
  );
}