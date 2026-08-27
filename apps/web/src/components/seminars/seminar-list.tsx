"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Calendar, Check, Clock, Share2, Users, Video } from "lucide-react";
import {
  SeminarRegisterModal,
  formatDateTime,
  type SeminarLike,
} from "@/components/seminars/seminar-register-modal";

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

function ShareButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/seminars/${id}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      title={copied ? "Copied!" : "Copy seminar link"}
      aria-label={copied ? "Copied!" : "Copy seminar link"}
      onClick={copyLink}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
      style={{
        background: copied ? "rgba(15,169,104,0.12)" : "rgba(18,32,67,0.06)",
      }}
    >
      {copied ? (
        <Check size={14} style={{ color: "#0FA968" }} strokeWidth={2.5} />
      ) : (
        <Share2 size={14} style={{ color: "var(--body)" }} />
      )}
    </button>
  );
}

function SectionHeader({
  label,
  sub,
  count,
}: {
  label: string;
  sub: string;
  count: number;
}) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
      <div>
        <h2
          className="font-display font-medium tracking-[-0.02em] leading-[1.1]"
          style={{ fontSize: "clamp(24px,2.6vw,32px)", color: "var(--ink)" }}
        >
          {label}
        </h2>
        <p className="text-[14px] mt-[6px]" style={{ color: "var(--body)" }}>
          {sub}
        </p>
      </div>
      <span
        className="font-mono text-[10.5px] font-medium tracking-[0.25em] uppercase rounded-full px-3.5 py-[7px]"
        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
      >
        {count} {count === 1 ? "session" : "sessions"}
      </span>
    </div>
  );
}

export function SeminarList() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Seminar | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/seminars", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load seminars (${res.status})`);
      let data: { seminars?: Seminar[] };
      try {
        data = await res.json();
      } catch {
        throw new Error("Failed to load seminars");
      }
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

  const handleRegistered = useCallback(() => {
    load();
  }, [load]);

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
    <Link
      key={s.id}
      href={`/seminars/${s.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -14px rgba(18,32,67,0.1)" }}
    >
      <div className="relative h-[174px] overflow-hidden">
        {s.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image}
              alt={s.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(18,32,67,0.28), rgba(18,32,67,0.04) 45%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: s.type === "paid"
                ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                : "linear-gradient(135deg,#0FA968,#18A97A)",
            }}
          >
            <span
              className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"
              style={{ backdropFilter: "blur(2px)" }}
            >
              <Video className="w-5 h-5 text-white" />
            </span>
          </div>
        )}

        <span
          className="absolute left-3.5 top-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-[11px] py-[5px]"
          style={{
            background: "rgba(255,255,255,0.92)",
            color: s.type === "paid" ? "#6B4CE0" : "var(--brand-2)",
          }}
        >
          {s.type === "paid" ? `Paid${s.price ? ` · $${s.price}` : ""}` : "Free"}
        </span>
        <span
          className="absolute right-3.5 top-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-[9px] py-[5px]"
          style={{
            background: isUpcoming ? "var(--brand)" : "rgba(255,255,255,0.92)",
            color: isUpcoming ? "#fff" : "var(--body)",
          }}
        >
          {isUpcoming ? "Upcoming" : "Completed"}
        </span>
      </div>

      <div className="flex flex-col flex-1 gap-2.5 p-5">
        <h3 className="font-display text-[16.5px] font-semibold leading-[1.3]" style={{ color: "var(--ink)" }}>
          {s.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] font-medium" style={{ color: "var(--body)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-[13px] h-[13px]" style={{ color: "var(--brand-2)" }} />
            {formatDateTime(s.dateTime)}
          </span>
          {s.duration && (
            <span className="inline-flex items-center gap-1.5">
              <span style={{ color: "var(--line)" }}>·</span>
              <Clock className="w-[13px] h-[13px]" style={{ color: "var(--brand-2)" }} />
              {s.duration}
            </span>
          )}
        </div>

        {s.description && (
          <p className="text-[13px] leading-[1.6] line-clamp-3" style={{ color: "var(--body)" }}>
            {s.description}
          </p>
        )}

        <div
          className="mt-auto pt-4 border-t flex items-center justify-between gap-3"
          style={{ borderColor: "var(--line)" }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            <Users className="w-[14px] h-[14px]" style={{ color: "var(--brand)" }} />
            {s.registrations} joined
          </span>
          <div className="flex items-center gap-2">
            <ShareButton id={s.id} />
            {isUpcoming ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelected(s);
                }}
                className="rounded-full text-white text-[13px] font-medium px-5 py-[9px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Register with Gmail
              </button>
            ) : (
              <span
                className="text-[12px] font-medium"
                style={{ color: "var(--body)" }}
              >
                Session ended
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
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
        <div className="py-20 text-center">
          <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            No seminars right now
          </p>
          <p className="text-[13.5px] mt-2" style={{ color: "var(--body)" }}>
            Check back soon — new sessions are added regularly.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-16">
              <SectionHeader
                label="Upcoming seminars"
                sub="Book your spot before the seats fill up."
                count={upcoming.length}
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                {upcoming.map((s) => renderCard(s, true))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <SectionHeader
                label="Recent seminars"
                sub="Past sessions — see who joined and what was covered."
                count={recent.length}
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                {recent.map((s) => renderCard(s, false))}
              </div>
            </section>
          )}
        </>
      )}

      {selected && (
        <SeminarRegisterModal
          seminar={selected as SeminarLike}
          onClose={() => setSelected(null)}
          onRegistered={handleRegistered}
        />
      )}
    </div>
  );
}