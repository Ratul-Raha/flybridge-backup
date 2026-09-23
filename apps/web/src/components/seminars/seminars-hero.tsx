"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plane } from "lucide-react";

const STATS_BASE = [
  { label: "Learners guided" },
  { value: "120+", label: "Sessions hosted" },
  { value: "15+", label: "Countries covered" },
];

const FLIGHTS = [
  { id: "FB-321", dest: "Toronto", topic: "Work permits in 2026 — live", status: "boarding" },
  { id: "FB-087", dest: "London", topic: "Student visa essentials", status: "ontime" },
  { id: "FB-214", dest: "Sydney", topic: "CVs that convert", status: "open" },
  { id: "FB-402", dest: "Dublin", topic: "IRCC timelines decoded", status: "ontime" },
  { id: "FB-118", dest: "Vancouver", topic: "Interview bootcamp Q&A", status: "open" },
] as const;

type FlightStatus = (typeof FLIGHTS)[number]["status"];

const TICKER = [
  "Toronto",
  "Work permits",
  "London",
  "Student visas",
  "Sydney",
  "Cover letters",
  "Dublin",
  "IRCC updates",
  "Vancouver",
  "Interview prep",
  "Calgary",
  "Resume reviews",
];

function StatusBadge({ status }: { status: FlightStatus }) {
  if (status === "boarding") {
    return (
      <span
        className="fb-blink w-[60px] text-right font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "#4ADE9B" }}
      >
        ● Boarding
      </span>
    );
  }
  if (status === "open") {
    return (
      <span
        className="w-[60px] text-right font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "#F4B740" }}
      >
        ● Open
      </span>
    );
  }
  return (
    <span
      className="w-[60px] whitespace-nowrap text-right font-mono text-[9px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: "rgba(255,255,255,0.5)" }}
    >
      On time
    </span>
  );
}

function BoardingCountdown() {
  const [left, setLeft] = useState(2 * 3600 + 14 * 60 + 36);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <span
      className="font-mono text-[14px] font-bold tabular-nums tracking-[0.08em]"
      style={{ color: "#4ADE9B" }}
    >
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

function DepartureBoard() {
  return (
    <div className="px-3.5 pb-3.5 pt-3" style={{ background: "#0E1A33" }}>
      <div className="flex items-center gap-2 px-1 pb-2 font-mono text-[8.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.45)" }}>
        <span className="w-[50px]">Flight</span>
        <span className="w-[84px]">To</span>
        <span className="flex-1">Session</span>
        <span className="w-[60px] text-right">Status</span>
      </div>

      <div className="space-y-[3px]">
        {FLIGHTS.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-2 rounded-md border border-transparent px-1 py-[7px] transition-colors duration-200 hover:border-white/10 hover:bg-white/[0.04]"
          >
            <span className="w-[50px] font-mono text-[11px] font-bold tracking-wider" style={{ color: "#4ADE9B" }}>
              {f.id}
            </span>
            <span className="w-[84px] truncate font-mono text-[11px] font-semibold text-white">{f.dest}</span>
            <span className="flex-1 truncate text-[11.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>
              {f.topic}
            </span>
            <StatusBadge status={f.status} />
          </div>
        ))}
      </div>

      <div
        className="mt-2.5 flex items-center justify-between rounded-md border px-3 py-[7px]"
        style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.5)" }}>
          Next boarding in
        </span>
        <BoardingCountdown />
      </div>
    </div>
  );
}

export function SeminarsHero({ userCount = 10000 }: { userCount?: number }) {
  const stats = [
    { value: `${userCount.toLocaleString()}+`, label: STATS_BASE[0].label },
    ...STATS_BASE.slice(1),
  ];

  return (
    <section className="relative overflow-hidden pt-[clamp(120px,15vh,150px)]">
      {/* Background image + overlays */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Image
          src="/seminars/seminar-1.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,32,67,0.9) 0%, rgba(15,32,67,0.62) 42%, rgba(15,32,67,0.18) 100%)",
          }}
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,32,67,0.85) 0%, rgba(15,32,67,0.55) 60%, rgba(15,32,67,0.4) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-14 px-[clamp(20px,4.5vw,56px)] pb-16 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
        {/* Left: copy */}
        <div
          className="rounded-lg border border-white/25 bg-white/10 px-[clamp(22px,4vw,44px)] py-[clamp(26px,4vw,48px)] backdrop-blur-xl"
          style={{ boxShadow: "0 24px 60px -30px rgba(15,32,67,0.6)" }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white"
          >
            <span className="h-[6px] w-[6px] rounded-full" style={{ background: "var(--brand-2)" }} />
            Live online events
          </span>

          <h1
            className="mt-5 font-display font-medium tracking-[-0.02em] text-white"
            style={{ fontSize: "clamp(30px,3.8vw,48px)", lineHeight: 1.08 }}
          >
            Live seminars on
            <br />
            studying, working &amp;
            <br />
            <span style={{ color: "#4ADE9B" }}>building a life abroad</span>
          </h1>

          <p
            className="mt-5 max-w-[480px] text-[15.5px] leading-[1.65]"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            Join free online seminars led by experts and people who&apos;ve been
            where you&apos;re going — and get answers that actually help.
          </p>

          {/* Stats */}
          <div className="mt-9 flex max-w-[560px] flex-wrap items-center gap-x-8 gap-y-5">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-x-8">
                <div>
                  <div
                    className="font-display font-medium leading-none tracking-[-0.02em] text-white"
                    style={{ fontSize: "clamp(22px,2.2vw,28px)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[12.5px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {stat.label}
                  </div>
                </div>
                {i < stats.length - 1 && (
                  <span className="hidden h-9 w-px sm:block" style={{ background: "rgba(255,255,255,0.3)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: live departures board */}
        <div className="relative mx-auto flex h-[440px] w-full max-w-[560px] items-center justify-center sm:h-[480px] lg:h-[500px]">
          <div className="absolute left-1/2 top-1/2 w-[min(90%,470px)] -translate-x-1/2 -translate-y-1/2">
            <div
              className="overflow-hidden rounded-lg border border-white/40 bg-white"
              style={{ boxShadow: "0 40px 80px -40px rgba(15,32,67,0.55)" }}
            >
              {/* Panel header */}
              <div
                className="flex items-center gap-2 border-b px-4 py-2.5"
                style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
              >
                <Plane className="h-3.5 w-3.5" style={{ color: "var(--brand-2)" }} />
                <span className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  FlyBridge departures
                </span>
                <span
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white"
                  style={{ background: "var(--brand)" }}
                >
                  <span className="fb-blink h-1 w-1 rounded-full bg-white" />
                  Live
                </span>
              </div>

              {/* Departure board */}
              <DepartureBoard />

              {/* Scrolling destination ticker */}
              <div
                className="fb-marquee overflow-hidden border-t"
                style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
              >
                <div
                  className="fb-marquee-track flex w-max items-center gap-6 whitespace-nowrap px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--body)" }}
                >
                  {[0, 1].map((dup) => (
                    <div key={dup} className="flex items-center gap-6" aria-hidden={dup === 1}>
                      {TICKER.map((t, i) => (
                        <span key={`${dup}-${i}`} className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-2)" }} />
                          {t}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}