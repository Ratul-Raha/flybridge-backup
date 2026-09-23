"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Check, Clock, Share2, Users } from "lucide-react";
import {
  SeminarRegisterModal,
  formatDateTime,
  type SeminarLike,
} from "@/components/seminars/seminar-register-modal";
import { formatPriceText } from "@/lib/pricing";

export type SeminarData = {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  image: string | null;
  type: "free" | "paid";
  price: number;
  prices?: { USD?: number; BDT?: number } | null;
  url: string | null;
  duration: string | null;
  registrations: number;
};

export function SeminarDetail({ seminar: initial }: { seminar: SeminarData }) {
  const [seminar, setSeminar] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [registering, setRegistering] = useState(false);

  const upcoming = new Date(seminar.dateTime) >= new Date();
  const paid = seminar.type === "paid";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/seminars/${seminar.id}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <Link
        href="/seminars"
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200 hover:opacity-70"
        style={{ color: "var(--brand)" }}
      >
        <ArrowLeft size={15} /> All seminars
      </Link>

      <div
        className="mt-6 overflow-hidden rounded-lg border bg-white"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="relative h-[220px] sm:h-[280px] overflow-hidden">
          {seminar.image ? (
            <>
              <Image
                src={seminar.image}
                alt={seminar.title}
                fill
                sizes="(max-width: 640px) 100vw, 1320px"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(18,32,67,0.30), rgba(18,32,67,0.05) 45%)",
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center font-display text-[16px] text-white"
              style={{
                background: paid
                  ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                  : "linear-gradient(135deg,#0FA968,#18A97A)",
              }}
            >
              FlyBridge Seminar
            </div>
          )}

          <span
            className="absolute left-5 top-5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] rounded-full px-[12px] py-[6px]"
            style={
              paid
                ? { background: "rgba(111,76,224,0.14)", color: "#6B4CE0" }
                : { background: "var(--brand-soft)", color: "var(--brand)" }
            }
          >
            {paid ? `Paid · ${formatPriceText(seminar)}` : "Free"}
          </span>
          <span
            className="absolute right-5 top-5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] rounded-full px-[12px] py-[6px]"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: upcoming ? "var(--brand)" : "var(--body)",
            }}
          >
            {upcoming ? "Upcoming" : "Completed"}
          </span>
        </div>

        <div className="p-6 sm:p-9">
          <div
            className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[12.5px]"
            style={{ color: "var(--body)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} /> {formatDateTime(seminar.dateTime)}
            </span>
            {seminar.duration && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {seminar.duration}
                </span>
              </>
            )}
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} /> {seminar.registrations} joined
            </span>
          </div>

          <h1
            className="font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-[-0.02em] leading-[1.12] mt-3"
            style={{ color: "var(--ink)" }}
          >
            {seminar.title}
          </h1>

          {seminar.description && (
            <p
              className="text-[15px] leading-[1.75] mt-4 max-w-[680px] whitespace-pre-line"
              style={{ color: "var(--body)" }}
            >
              {seminar.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
            {upcoming ? (
              paid ? (
                <button
                  type="button"
                  onClick={() => setRegistering(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "var(--brand)" }}
                >
                  Buy now · {formatPriceText(seminar)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setRegistering(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-brand-2/20 active:scale-[0.98]"
                  style={{ background: "var(--brand)" }}
                >
                  Register with Gmail
                </button>
              )
            ) : (
              <span
                className="inline-flex items-center rounded-full border px-7 py-3.5 text-[14px] font-semibold"
                style={{ borderColor: "var(--line)", color: "var(--body)" }}
              >
                Session ended
              </span>
            )}

            {seminar.url && (
              <a
                href={seminar.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-[14px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)] active:scale-[0.98]"
                style={{ borderColor: "var(--brand-2)", color: "var(--brand-2)" }}
              >
                {upcoming ? "Join session" : "Watch session"}
              </a>
            )}

            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-7 py-3.5 text-[14px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)] active:scale-[0.98]"
              style={{
                borderColor: "var(--line)",
                color: copied ? "#0FA968" : "var(--ink)",
              }}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              {copied ? "Link copied!" : "Share"}
            </button>
          </div>
        </div>
      </div>

      {registering && (
        <SeminarRegisterModal
          seminar={seminar as SeminarLike}
          onClose={() => setRegistering(false)}
          onRegistered={() =>
            setSeminar((s) => ({ ...s, registrations: s.registrations + 1 }))
          }
        />
      )}
    </div>
  );
}