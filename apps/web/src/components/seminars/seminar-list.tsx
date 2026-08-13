"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Check, Share2, Users } from "lucide-react";
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

export function SeminarList() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Seminar | null>(null);

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
      className="group flex flex-col overflow-hidden rounded-[24px] border bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -14px rgba(18,32,67,0.12)" }}
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

        <h3
          className="font-display text-[18px] font-semibold leading-snug"
          style={{ color: "var(--ink)" }}
        >
          {s.title}
        </h3>

        <p className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
          📅 {formatDateTime(s.dateTime)}
        </p>

        {s.description && (
          <p
            className="text-[13.5px] leading-[1.6] line-clamp-3"
            style={{ color: "var(--body)" }}
          >
            {s.description}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
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
        <SeminarRegisterModal
          seminar={selected as SeminarLike}
          onClose={() => setSelected(null)}
          onRegistered={handleRegistered}
        />
      )}
    </div>
  );
}