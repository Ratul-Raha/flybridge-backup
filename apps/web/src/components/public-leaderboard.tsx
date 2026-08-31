import Link from "next/link";
import { computeLeaderboard } from "@/lib/leaderboard";

type Person = { name: string; avatar: string | null };

const RING = "#0FA968";

function Initials({ name }: { name: string }) {
  const init = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="flex items-center justify-center rounded-full text-white font-medium shrink-0"
      style={{ width: 40, height: 40, fontSize: 13, background: "linear-gradient(135deg,#0FA968,#40C4F0)" }}
    >
      {init}
    </span>
  );
}

export async function PublicLeaderboard() {
  let top: Person[] = [];
  try {
    const res = await computeLeaderboard({ limit: 5, periodDays: 7 });
    top = res.entries.map((e) => ({
      name: e.user.name,
      avatar: e.user.avatar,
    }));
  } catch (error) {
    console.error("PublicLeaderboard error", error);
    top = [];
  }

  return (
    <section id="leaderboard" className="py-[clamp(80px,10vw,140px)] px-[clamp(20px,4.5vw,56px)]" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-[clamp(36px,5vw,80px)] items-center">
        {/* Editorial copy */}
        <div className="max-w-[560px]">
          <div className="flex items-center gap-3">
            <span className="inline-block w-8 h-[2px] rounded-full" style={{ background: "var(--brand)" }} />
            <span className="font-mono text-[11px] font-medium tracking-[0.32em] uppercase" style={{ color: "var(--brand-2)" }}>
              Weekly leaderboard
            </span>
          </div>

          <h2
            className="mt-7 font-display font-semibold tracking-[-0.03em] leading-[1.06] text-balance"
            style={{ fontSize: "clamp(32px,3.6vw,48px)", color: "var(--ink)" }}
          >
            Consistency earns
            <br />
            <span style={{ color: "var(--brand)" }}>the spotlight.</span>
          </h2>

          <p className="mt-6 text-[15px] leading-[1.85] max-w-[440px]" style={{ color: "var(--body)" }}>
            Every week we surface the five learners who moved their journey forward the most. No
            prizes, no games — just proof that steady progress is what gets you there.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-6">
            <Link
              href="/login?mode=register"
              className="group inline-flex items-center gap-2 text-[14.5px] font-semibold transition-colors"
              style={{ color: "var(--brand-2)" }}
            >
              Claim your spot
              <span className="flex items-center transition-transform duration-250 group-hover:translate-x-1">
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                </svg>
              </span>
            </Link>
            <span className="hidden sm:block w-px h-5" style={{ background: "var(--line)" }} />
            <span className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--body)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: "var(--brand)" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--brand)" }} />
              </span>
              Reshuffled every Monday
            </span>
          </div>
        </div>

        {/* Standings card */}
        <div
          className="rounded-[24px] border bg-white"
          style={{ borderColor: "var(--line)", boxShadow: "0 40px 90px -56px rgba(18,32,67,0.4)" }}
        >
          <div className="flex items-center justify-between px-7 pt-6 pb-5">
            <span className="font-mono text-[10.5px] font-medium tracking-[0.28em] uppercase" style={{ color: "var(--body)" }}>
              Top 5 · This week
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Weekly
            </span>
          </div>

          {top.length === 0 ? (
            <div className="px-7 pb-8 text-[14px]" style={{ color: "var(--body)" }}>
              The leaderboard is warming up — be the first name on it.
            </div>
          ) : (
            <ol>
              {top.map((p, i) => {
                const rank = i + 1;
                const isFirst = rank === 1;
                return (
                  <li
                    key={`${p.name}-${rank}`}
                    className="flex items-center gap-4 px-7 py-4 transition-colors duration-200"
                    style={{
                      background: isFirst ? "linear-gradient(90deg, rgba(15,169,104,0.06), transparent)" : undefined,
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold"
                      style={{
                        background: isFirst ? "var(--brand)" : "var(--bg-soft)",
                        color: isFirst ? "#fff" : "var(--body)",
                      }}
                    >
                      {rank}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      {p.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.avatar}
                          alt=""
                          className="shrink-0 rounded-full object-cover"
                          style={{ width: 40, height: 40, boxShadow: isFirst ? `0 0 0 2px ${RING}` : "none" }}
                        />
                      ) : (
                        <span className="shrink-0" style={{ boxShadow: isFirst ? `0 0 0 2px ${RING}` : "none", borderRadius: 9999 }}>
                          <Initials name={p.name} />
                        </span>
                      )}
                      <span
                        className="truncate text-[15px] font-medium"
                        style={{ color: isFirst ? "var(--brand-2)" : "var(--ink)" }}
                      >
                        {p.name}
                      </span>
                    </div>
                    {isFirst && (
                      <span
                        className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[0.16em] uppercase"
                        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                      >
                        Leader
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {top.length > 0 && (
            <div
              className="flex items-center justify-between gap-4 rounded-b-[24px] px-7 py-4"
              style={{ borderTop: "1px solid var(--line)", background: "var(--bg-soft)" }}
            >
              <span className="text-[12.5px]" style={{ color: "var(--body)" }}>
                Based on course progress &amp; weekly quiz activity
              </span>
              <Link href="/leaderboard" className="group inline-flex items-center gap-1.5 text-[13px] font-semibold shrink-0" style={{ color: "var(--brand-2)" }}>
                View full leaderboard
                <svg className="w-[12px] h-[12px] transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}