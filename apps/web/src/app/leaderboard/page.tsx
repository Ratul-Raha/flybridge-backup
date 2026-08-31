import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { ShareLeaderboardButton } from "@/components/leaderboard-share-button";
import { computeLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard | FlyBridge",
  description:
    "The weekly FlyBridge scoreboard — the top 10 learners, ranked by course progress and quiz activity, reshuffled every Monday.",
};

const METAL: Record<number, { bar: string; ring: string; num: string; name: string }> = {
  1: { bar: "linear-gradient(180deg,#F5C518,#C78E0E)", ring: "#D9A521", num: "#A87B00", name: "Gold" },
  2: { bar: "linear-gradient(180deg,#CBD5E1,#8A96A5)", ring: "#94A3B8", num: "#64748B", name: "Silver" },
  3: { bar: "linear-gradient(180deg,#E08A3C,#A15C1D)", ring: "#C2712F", num: "#A15C07", name: "Bronze" },
};

const BAR_H: Record<number, string> = { 1: "300px", 2: "216px", 3: "168px" };

const GRAD_TEXT = {
  background: "linear-gradient(92deg,#0FA968 0%,#14B57E 45%,#2F5FE0 110%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

function Initials({ name, size }: { name: string; size: number }) {
  const init = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="flex items-center justify-center rounded-full text-white font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32, background: "var(--ink)" }}
    >
      {init}
    </span>
  );
}

function Avatar({ entry, size }: { entry: LeaderboardEntry; size: number }) {
  if (entry.user.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={entry.user.avatar}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, border: "1px solid var(--line)" }}
      />
    );
  }
  return <Initials name={entry.user.name} size={size} />;
}

export default async function LeaderboardPage() {
  let entries: LeaderboardEntry[] = [];
  try {
    const res = await computeLeaderboard({ limit: 10, periodDays: 7 });
    entries = res.entries;
  } catch (error) {
    console.error("LeaderboardPage error", error);
    entries = [];
  }

  const podium = entries.slice(0, 3);
  const names = entries.map((e) => e.user.name);

  return (
    <>
      <Nav />
      <main>
        {/* ─────────────────────────────────── HERO ─────────────────────────────────── */}
        <section
          className="pt-[170px] pb-[110px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{ background: "linear-gradient(180deg,#F7FBF9 0%, #FFFFFF 52%)" }}
        >
          {/* soft backdrop glow */}
          <div className="pointer-events-none absolute inset-0 select-none">
            <div className="absolute -top-32 right-[10%] w-[520px] h-[420px] rounded-full blur-[130px]" style={{ background: "rgba(15,169,104,0.12)" }} />
            <div className="absolute top-40 -left-28 w-[420px] h-[420px] rounded-full blur-[120px]" style={{ background: "rgba(47,95,224,0.08)" }} />
          </div>

          <div className="relative max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-[48px] lg:gap-[80px] items-center">
            {/* Copy */}
            <div>
              <div className="flex items-center gap-3 font-mono text-[11.5px] font-medium tracking-[0.32em] uppercase" style={{ color: "var(--brand-2)" }}>
                <span className="w-7 h-[2px] rounded-full" style={{ background: "var(--brand)" }} />
                FlyBridge · Weekly
              </div>

              <h1 className="mt-7 font-display font-semibold leading-[1.1] tracking-[-0.02em] text-balance max-w-[600px]" style={{ color: "var(--ink)", fontSize: "clamp(36px,4.4vw,52px)" }}>
                Progress has a{" "}
                <span style={GRAD_TEXT}>scoreboard.</span>
              </h1>

              <p className="mt-6 max-w-[470px] text-[17px] leading-[1.75]" style={{ color: "var(--body)" }}>
                Every Monday we crown the ten learners who moved furthest on their journey abroad —
                ranked by lessons finished, quizzes passed and recent momentum.
              </p>

              <div className="mt-9 flex items-center gap-4 flex-wrap">
                <a
                  href="/login?mode=register"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold text-white transition-all duration-250 hover:-translate-y-0.5"
                  style={{ background: "var(--brand)", boxShadow: "0 18px 36px -16px rgba(15,169,104,0.6)" }}
                >
                  Get on the board
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                  </svg>
                </a>
                <a
                  href="#board"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors"
                  style={{ color: "var(--ink)", border: "1px solid var(--line)", background: "#fff" }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M5 12L11 6M5 12L11 18" />
                  </svg>
                  See this week&apos;s board
                </a>
              </div>

              <div className="flex items-center gap-8 mt-12">
                {[
                  { value: "10", label: "Ranked weekly" },
                  { value: "7 days", label: "Measuring window" },
                  { value: "Mon", label: "Chart refresh" },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-center gap-8">
                    <div>
                      <div className="font-display text-[26px] leading-none font-bold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>{s.value}</div>
                      <div className="mt-2 font-mono text-[10px] font-medium tracking-[0.3em] uppercase" style={{ color: "var(--body)" }}>{s.label}</div>
                    </div>
                    {i < arr.length - 1 && <span className="w-px h-10" style={{ background: "var(--line)" }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Podium ─── */}
            <div className="relative select-none">
              <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 font-display font-bold leading-none whitespace-nowrap" style={{ color: "rgba(18,32,67,0.05)", fontSize: "clamp(90px,14vw,190px)" }}>
                01
              </div>

              <div className="relative grid grid-cols-3 gap-3 sm:gap-6 items-end" style={{ height: 340 }}>
                {podium.length === 0 ? (
                  <div className="col-span-3 h-full rounded-2xl border border-line bg-white flex items-center justify-center px-6">
                    <p className="text-[14.5px] text-center" style={{ color: "var(--body)" }}>
                      The leaderboard is warming up — be the first name on it.
                    </p>
                  </div>
                ) : (
                  (["2", "1", "3"] as const).map((slot) => {
                    const rank = Number(slot);
                    const entry = podium[rank - 1];
                    if (!entry) return null;
                    const m = METAL[rank];
                    return (
                      <div key={entry.user.name} className="relative flex flex-col items-center justify-end h-full min-w-0">
                        {/* avatar + name */}
                        <div className="mb-3 flex flex-col items-center">
                          <span className="rounded-full" style={{ padding: 3, border: `2.5px solid ${m.ring}`, background: "#fff", boxShadow: `0 10px 26px -10px ${m.ring}` }}>
                            <Avatar entry={entry} size={rank === 1 ? 66 : 56} />
                          </span>
                          <span
                            className="mt-2 max-w-[130px] rounded-full border px-3 py-1 text-[12px] font-semibold truncate bg-white"
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          >
                            {entry.user.name}
                          </span>
                        </div>
                        {/* bar */}
                        <div
                          className="relative w-full rounded-t-[22px]"
                          style={{ height: BAR_H[rank], background: m.bar, boxShadow: `0 -14px 34px -22px ${m.ring}` }}
                        >
                          <span className="absolute left-1/2 bottom-3 -translate-x-1/2 font-mono text-[11px] font-bold tracking-[0.24em] text-white/90">
                            {String(rank).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* podium base */}
                <div
                  className="absolute bottom-0 inset-x-0 h-3 rounded-full"
                  style={{ background: "linear-gradient(90deg,#E7EAF2,#C6CDD9,#E7EAF2)", boxShadow: "0 8px 20px -10px rgba(18,32,67,0.35)" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────── LIVE TICKER (dark accent band) ───────────────────── */}
        {names.length > 0 && (
          <div className="relative py-4 overflow-hidden" style={{ background: "var(--ink)" }}>
            <div className="fb-marquee flex items-center w-full overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
              <div className="fb-marquee-track flex items-center gap-[26px] pr-[26px] shrink-0">
                {[...names, ...names].map((n, i) => (
                  <span key={`${n}-${i}`} className="flex items-center gap-[26px] whitespace-nowrap text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {n}
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="#14B57E">
                      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────── THE BOARD ───────────────────────────── */}
        <section id="board" className="px-[clamp(20px,4.5vw,56px)] pt-[100px] pb-[110px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                  The board
                </div>
                <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(28px,3.4vw,38px)", color: "var(--ink)" }}>
                  This week&apos;s top 10
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[14px] font-medium" style={{ color: "var(--body)" }}>
                <span className="w-[7px] h-[7px] rounded-full animate-pulse" style={{ background: "var(--brand)" }} />
                Updated daily · Reshuffled Monday
              </div>
              <ShareLeaderboardButton />
            </div>

            {entries.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white px-7 py-16 text-center">
                <p className="text-[14px]" style={{ color: "var(--body)" }}>
                  Nothing on the board yet — the first ten learners to make progress get the glory.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] border border-line bg-white overflow-hidden" style={{ boxShadow: "0 60px 120px -70px rgba(18,32,67,0.5)" }}>
                <ol>
                  {entries.map((entry, i) => {
                    const rank = i + 1;
                    const metal = METAL[rank];
                    const isTop = rank <= 3;
                    return (
                      <li
                        key={entry.user.name}
                        className="grid grid-cols-[64px_1fr_auto] sm:grid-cols-[80px_1fr_auto] items-center gap-4 sm:gap-6 px-6 sm:px-8 py-5"
                        style={{
                          borderTop: i === 0 ? undefined : "1px solid var(--line)",
                          borderLeft: isTop ? `3px solid ${metal?.ring}` : "3px solid transparent",
                          background: isTop ? "linear-gradient(90deg, rgba(18,32,67,0.02), transparent 40%)" : undefined,
                        }}
                      >
                        <span className="font-display text-[18px] sm:text-[20px] font-semibold tracking-[-0.01em] leading-none" style={{ color: isTop ? metal!.num : "var(--body)" }}>
                          {String(rank).padStart(2, "0")}
                        </span>
                        <div className="flex min-w-0 items-center gap-4">
                          <Avatar entry={entry} size={40} />
                          <span className="min-w-0 truncate text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                            {entry.user.name}
                          </span>
                        </div>
                        {isTop && (
                          <span
                            className="rounded-full px-3.5 py-1 font-mono text-[9.5px] font-semibold tracking-[0.22em] uppercase"
                            style={{ background: `linear-gradient(90deg, ${metal!.ring}1A, ${metal!.ring}0D)`, color: metal!.num, border: `1px solid ${metal!.ring}40` }}
                          >
                            {metal!.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
        </section>

        {/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */}
        <section id="how-it-works" className="px-[clamp(20px,4.5vw,56px)] pb-[110px]">
          <div className="max-w-[1320px] mx-auto rounded-[28px] border border-line px-[clamp(24px,5vw,72px)] py-[80px]" style={{ background: "linear-gradient(180deg,#F6FAF8,#FFFFFF)" }}>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-[56px] lg:gap-[80px]">
              {/* Left: intro */}
              <div>
                <div className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-5" style={{ color: "var(--brand-2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                  How it works
                </div>
                <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(28px,3.4vw,38px)", color: "var(--ink)" }}>
                  No luck involved.
                  <br />
                  Just learning.
                </h2>
                <p className="text-[15.5px] leading-[1.75] mt-5 max-w-[400px]" style={{ color: "var(--body)" }}>
                  The chart rewards effort alone. Here&apos;s exactly how a name gets to the top.
                </p>

                <div className="mt-8 rounded-2xl border border-line bg-white px-6 py-5 flex items-start gap-3.5" style={{ boxShadow: "0 20px 40px -30px rgba(18,32,67,0.3)" }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--brand-soft)" }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </span>
                  <p className="text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>Good to know:</span> the board resets
                    every Monday, but your learning record never does. Steady daily work beats weekend
                    sprints, every time.
                  </p>
                </div>
              </div>

              {/* Right: timeline */}
              <ol className="relative">
                <span aria-hidden className="absolute left-[23px] top-6 bottom-6 w-px" style={{ background: "linear-gradient(180deg, var(--brand), rgba(18,32,67,0.12))" }} />
                {[
                  {
                    step: "01",
                    title: "Pick a course and start learning",
                    desc: "Join any track — Study Abroad, Work Abroad, English or Interview Readiness — and finish your first lesson within the week.",
                    icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />,
                  },
                  {
                    step: "02",
                    title: "Finish lessons and pass quizzes",
                    desc: "Every completed module and correct quiz answer adds to your weekly total. Accuracy matters as much as activity.",
                    icon: <path d="M9 12l2 2 4-4M8 3h8a1 1 0 0 1 1 1v15l-5-3-5 3V4a1 1 0 0 1 1-1z" />,
                  },
                  {
                    step: "03",
                    title: "See your name rise on Monday",
                    desc: "The board reshuffles weekly. Out-learn the rest and your rank climbs — simple, measurable, fair.",
                    icon: <path d="M3 17l6-6 4 4 7-7M14 8h6v6" />,
                  },
                ].map((s) => (
                  <li key={s.step} className="relative flex gap-5 pb-10 last:pb-0">
                    <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#05221a]" style={{ background: "linear-gradient(135deg,#14B57E,#0FA968)", boxShadow: "0 12px 26px -12px rgba(15,169,104,0.7)" }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        {s.icon}
                      </svg>
                    </span>
                    <div className="pt-1">
                      <span className="font-mono text-[11px] font-bold tracking-[0.28em]" style={{ color: "var(--brand-2)" }}>
                        STEP {s.step}
                      </span>
                      <h3 className="mt-1.5 font-display text-[20px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>{s.title}</h3>
                      <p className="mt-2 text-[14.5px] leading-[1.7] max-w-[460px]" style={{ color: "var(--body)" }}>{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ───────────────────────────── CTA ───────────────────────────── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto rounded-[28px] relative overflow-hidden px-[clamp(24px,6vw,80px)] py-[clamp(48px,6vw,90px)]" style={{ background: "var(--ink)" }}>
            {/* backdrop */}
            <div className="pointer-events-none absolute inset-0 select-none">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[620px] h-[300px] rounded-full blur-[110px]" style={{ background: "rgba(20,181,126,0.28)" }} />
              <div className="absolute -right-20 bottom-0 w-[420px] h-[300px] rounded-full blur-[110px]" style={{ background: "rgba(47,95,224,0.18)" }} />
              <span className="absolute -bottom-10 right-8 font-display font-bold leading-none" style={{ color: "rgba(255,255,255,0.05)", fontSize: "clamp(140px,20vw,260px)" }}>
                10
              </span>
            </div>

            <div className="relative text-center">
              <div className="font-mono text-[11.5px] font-medium tracking-[0.32em] uppercase inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)" }}>
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: "#14B57E" }} />
                Fresh board every Monday
              </div>
              <h2 className="mt-7 font-display font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance mx-auto max-w-[720px]" style={{ fontSize: "clamp(28px,3.4vw,40px)" }}>
                Your name.
                <br />
                <span style={GRAD_TEXT}>Every Monday.</span>
              </h2>
              <p className="mt-6 text-[16.5px] leading-[1.7] mx-auto max-w-[520px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                Enroll today, learn a little every day, and let the scoreboard tell the story.
              </p>
              <div className="mt-9 flex items-center justify-center gap-4 flex-wrap">
                <a
                  href="/login?mode=register"
                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold text-[#05231A] transition-all duration-250 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#34D399,#14B57E)", boxShadow: "0 20px 44px -18px rgba(20,181,126,0.7)" }}
                >
                  Start climbing today
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                  </svg>
                </a>
                <a
                  href="/programs"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-[15px] font-semibold text-white transition-colors duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  Browse programs
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}