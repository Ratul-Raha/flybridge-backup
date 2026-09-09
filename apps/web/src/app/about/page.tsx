import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Plane } from "lucide-react";
import { getTotalUsers } from "@/lib/site-stats";

export const metadata: Metadata = {
  title: "About | FlyBridge Education Group",
  description:
    "FlyBridge Education Group Inc. bridges international students to top educational institutions across Canada and the world — with 12+ years of student recruitment and counseling experience.",
};

const stats = [
  { value: "12+", label: "Years of experience" },
  { value: "40+", label: "Partner universities" },
  { value: "10,000+", label: "Students supported" },
  { value: "02", label: "Global strategic partners" },
];

function buildStats(totalUsers: number) {
  return stats.map((s) =>
    s.label === "Students supported"
      ? { value: `${totalUsers.toLocaleString()}+`, label: s.label }
      : s
  );
}

const ecosystem = [
  {
    code: "DL-01",
    initials: "DL",
    title: "Dream Language Institute",
    role: "English language preparation",
    desc: "Our specialized English language preparation hubs, equipping students with the proficiency needed for global academic success.",
    gradient: "linear-gradient(135deg, #6B4CE0, #4A2FC0)",
  },
  {
    code: "NV-02",
    initials: "NV",
    title: "New Visa Express",
    role: "Student counseling network",
    desc: "Providing transparent academic placement, credential evaluation and visa guidance to ambitious students across South Asia.",
    gradient: "linear-gradient(135deg, #0B5E46, #06382C)",
  },
];

const officialPartners = [
  {
    initials: "ID",
    name: "IDP Education",
    role: "IELTS & English assessment",
    gradient: "linear-gradient(135deg, #0E7A8A, #0A5C68)",
  },
  {
    initials: "BC",
    name: "British Council",
    role: "English assessment & IELTS preparation",
    gradient: "linear-gradient(135deg, #C0392B, #93251C)",
  },
];

const steps = [
  {
    title: "Pre-screen",
    desc: "We evaluate academic background, goals and readiness to match each student with the right pathway.",
  },
  {
    title: "Train",
    desc: "Language preparation through Dream Language Institute, plus practical career-readiness courses.",
  },
  {
    title: "Support",
    desc: "End-to-end guidance — applications, credential evaluation and visa processing with New Visa Express.",
  },
];

const stations = [
  { code: "ST-01", name: "Ambition", tag: "Where you start" },
  { code: "ST-02", name: "Pathway", tag: "Built with you" },
  { code: "ST-03", name: "Opportunity", tag: "Where it leads" },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
      <span className="h-[6px] w-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
      {children}
    </div>
  );
}

function RouteConnector() {
  return (
    <div
      className="relative hidden h-px w-full md:block"
      style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--line) 0 7px, transparent 7px 14px)" }}
    >
      <span
        className="absolute left-1/2 top-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white"
        style={{ color: "var(--brand-2)" }}
      >
        <Plane size={13} />
      </span>
    </div>
  );
}

export default async function AboutPage() {
  const totalUsers = await getTotalUsers();
  const statsRows = buildStats(totalUsers);

  return (
    <>
      <Nav />
      <main>
        {/* ── HERO ───────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-[clamp(20px,4.5vw,56px)] pt-[150px] pb-[96px]"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 92% 4%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 2% 96%, rgba(107,76,224,0.07), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="mx-auto max-w-[1320px]">
            <div className="max-w-[860px]">
              <SectionEyebrow>ABOUT FLYBRIDGE</SectionEyebrow>

              <h1
                className="font-display font-medium leading-[1.08] tracking-[-0.02em] text-balance"
                style={{ fontSize: "clamp(34px,4.6vw,58px)", color: "var(--ink)" }}
              >
                We build the bridge between an ambition and a{" "}
                <span style={{ color: "var(--brand-2)" }}>world-class education.</span>
              </h1>

              <p className="mt-7 max-w-[620px] text-[16.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                FlyBridge Education Group Inc. is a Toronto-headquartered education group with 12+
                years in student recruitment and academic counseling — running language training,
                placement and visa guidance as one coordinated network across South Asia.
              </p>
            </div>

            {/* Route stations */}
            <div className="mt-14 grid max-w-[860px] grid-cols-1 items-center gap-y-5 md:grid-cols-[auto_1fr_auto_1fr_auto] md:gap-x-4">
              {stations.map((s, i) => (
                <div key={s.code} className="contents">
                  {i > 0 && <RouteConnector />}
                  <div
                    className="w-full rounded-lg border border-line bg-white px-7 py-6 md:w-auto"
                    style={{ boxShadow: "0 10px 24px -20px rgba(18,32,67,0.18)" }}
                  >
                    <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--brand-2)" }}>
                      {s.code}
                    </div>
                    <div className="mt-2 font-display text-[17px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                      {s.name}
                    </div>
                    <div className="mt-1 text-[12px]" style={{ color: "var(--body)" }}>
                      {s.tag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO WE ARE ─────────────────────────────────────── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[96px]">
          <div className="mx-auto grid max-w-[1320px] items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <SectionEyebrow>01 · WHO WE ARE</SectionEyebrow>
              <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
                The full journey, handled by one team
              </h2>
              <p className="mt-6 text-[15.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                We operate a fully integrated educational ecosystem across South Asia — English
                language preparation, academic counseling, credential evaluation and visa guidance —
                all under one roof, end to end.
              </p>
              <p className="mt-5 text-[15.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                Our job is to turn ambition into an outcome: the right university, the right visa,
                and the right start abroad.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-line bg-white" style={{ boxShadow: "0 24px 50px -34px rgba(18,32,67,0.22)" }}>
              <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--brand)" }} />
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--body)" }}>
                  At a glance
                </span>
              </div>
              <div>
                {statsRows.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-5 px-6 py-[18px]" style={{ borderTop: i === 0 ? undefined : "1px solid var(--line)" }}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: "var(--body)" }}>
                      {s.label}
                    </span>
                    <span className="h-px flex-1" style={{ borderTop: "1px dashed var(--line)" }} />
                    <span className="font-display text-[23px] font-semibold tracking-[-0.03em]" style={{ color: "var(--ink)" }}>
                      {s.value}
                      <span className="ml-1.5 text-[10px] align-middle text-[var(--brand)]">●</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[96px]">
          <div className="mx-auto max-w-[1320px] rounded-lg border border-line px-[clamp(24px,4.5vw,56px)] py-[70px]" style={{ background: "var(--bg-soft)" }}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionEyebrow>02 · HOW IT WORKS</SectionEyebrow>
                <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
                  Supported at every gate
                </h2>
              </div>
              <p className="max-w-[400px] text-[15px]" style={{ color: "var(--body)" }}>
                Three connected phases, one accountable team — so nothing falls between the cracks.
              </p>
            </div>

            <div className="relative mt-14">
              <div
                className="absolute left-[15%] right-[15%] top-[27px] hidden h-px md:block"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--line) 0 8px, transparent 8px 16px)" }}
              />
              <div className="grid gap-6 md:grid-cols-3">
                {steps.map((s, i) => (
                  <div
                    key={s.title}
                    className="relative rounded-lg border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                    style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-[6px] w-[6px] rounded-full" style={{ background: "var(--brand)" }} />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--brand-2)" }}>
                        Step {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-[18px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                      {s.title}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── THE ECOSYSTEM ──────────────────────────────────── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[96px]">
          <div className="mx-auto max-w-[1320px]">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
              <div>
                <SectionEyebrow>03 · THE ECOSYSTEM</SectionEyebrow>
                <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
                  One network. Every system working as one.
                </h2>
              </div>
              <p className="max-w-[400px] text-[15px]" style={{ color: "var(--body)" }}>
                Every piece of the journey is owned in-house — language, placement, visas and the
                credentials to back them up.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-line bg-white" style={{ boxShadow: "0 24px 50px -34px rgba(18,32,67,0.22)" }}>
              {ecosystem.map((e, i) => (
                <div
                  key={e.title}
                  className="flex flex-col gap-5 px-6 py-7 transition-colors duration-200 hover:bg-[var(--bg-soft)]/60 sm:flex-row sm:items-center sm:px-8"
                  style={{ borderTop: i === 0 ? undefined : "1px solid var(--line)" }}
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-display text-[14px] font-semibold text-white"
                    style={{ background: e.gradient, boxShadow: "0 8px 20px -12px rgba(18,32,67,0.5)" }}
                  >
                    {e.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-display text-[17px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                        {e.title}
                      </span>
                      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--brand-2)" }}>
                        {e.role}
                      </span>
                    </div>
                    <p className="mt-2 max-w-[680px] text-[14px] leading-[1.65]" style={{ color: "var(--body)" }}>
                      {e.desc}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tracking-[0.15em]" style={{ color: "var(--body)" }}>
                    {e.code}
                  </span>
                </div>
              ))}

              {/* Official partners */}
              <div className="grid gap-px border-t sm:grid-cols-2" style={{ borderColor: "var(--line)", background: "var(--line)" }}>
                {officialPartners.map((p) => (
                  <div key={p.name} className="flex items-center gap-4 bg-white px-6 py-6 transition-colors duration-200 hover:bg-[var(--bg-soft)]/60 sm:px-8">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-[12px] font-semibold text-white"
                      style={{ background: p.gradient }}
                    >
                      {p.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                        {p.name}
                      </div>
                      <div className="mt-[2px] truncate text-[12px]" style={{ color: "var(--body)" }}>
                        {p.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── REGISTRATION ───────────────────────────────────── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[110px]">
          <div
            className="mx-auto max-w-[1320px] overflow-hidden rounded-lg p-10 md:p-16"
            style={{
              backgroundImage:
                "radial-gradient(620px 340px at 100% 0%, rgba(20,181,126,0.16), transparent 62%), radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(135deg, #0C162E, #122043)",
              backgroundSize: "auto, 24px 24px, auto",
            }}
          >
            <div className="grid items-end gap-10 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-5" style={{ color: "#4ADE9B" }}>
                  <span className="h-[6px] w-[6px] rounded-full" style={{ background: "#4ADE9B" }} />
                  04 · REGISTERED
                </div>
                <h2 className="font-display font-semibold leading-[1.12] tracking-[-0.01em] text-white" style={{ fontSize: "clamp(26px,3.2vw,36px)" }}>
                  Registered in Ontario, Canada.
                </h2>
                <p className="mt-5 max-w-[560px] text-[15.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.75)" }}>
                  FlyBridge Education Group Inc. is incorporated in the Province of Ontario, with its
                  head office in Toronto — where our counseling and support teams guide students
                  across South Asia and beyond.
                </p>
              </div>

              <div className="rounded-lg border border-white/15 bg-white/[0.05] px-7 py-7 md:px-9 md:py-9">
                <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Ontario Corporation Number
                </div>
                <div className="mt-3 font-mono text-[clamp(22px,2.6vw,30px)] font-semibold tracking-[0.1em] text-white">
                  1001686187
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: "#4ADE9B" }} />
                  <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Toronto · Ontario
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}