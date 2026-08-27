import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { NetworkMap } from "@/components/network-map";

export const metadata: Metadata = {
  title: "Partnership | FlyBridge Education Group",
  description:
    "FlyBridge partners with 50+ universities across the US and Canada, alongside IDP and the British Council, to deliver trusted pathways to global education.",
};

const marqueeNames = [
  "Arizona State",
  "Northeastern",
  "UMass Boston",
  "Illinois Tech",
  "SUNY Buffalo",
  "University of Toronto",
  "UBC",
  "York University",
  "Simon Fraser",
  "Concordia",
  "IDP Education",
  "British Council",
];

const universities = [
  { name: "Arizona State University", country: "USA" },
  { name: "Northeastern University", country: "USA" },
  { name: "University of Massachusetts Boston", country: "USA" },
  { name: "Illinois Institute of Technology", country: "USA" },
  { name: "University at Buffalo", country: "USA" },
  { name: "University of Toronto", country: "Canada" },
  { name: "University of British Columbia", country: "Canada" },
  { name: "York University", country: "Canada" },
  { name: "Simon Fraser University", country: "Canada" },
  { name: "Concordia University", country: "Canada" },
];

const strategicPartners = [
  {
    initials: "ID",
    name: "IDP Education",
    role: "Study Abroad Partner",
    desc: "A global leader in international education, IDP works alongside FlyBridge to guide students through university selection, applications and enrolment — with direct access to trusted institutions across the world.",
  },
  {
    initials: "BC",
    name: "British Council",
    role: "English Proficiency Partner",
    desc: "As our official English assessment partner, the British Council equips learners with IELTS preparation and recognized language credentials — the foundation every international journey is built on.",
  },
];

const stats = [
  { value: "50+", label: "Partner universities" },
  { value: "10,000+", label: "Learners guided" },
  { value: "2", label: "Global strategic partners" },
  { value: "12+", label: "Countries reached" },
];

const workflowSteps = [
  {
    label: "Step 01 — Onboarding",
    title: "Join the network",
    desc: "Onboard as a university, language institute or education organization.",
    icon: <path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />,
  },
  {
    label: "Step 02 — Referral",
    title: "Students come to you",
    desc: "Our counselors and channels refer the right-fit learners to your programs.",
    icon: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  },
  {
    label: "Step 03 — Support",
    title: "We handle the full stack",
    desc: "Applications, IELTS readiness and visa processing — supported end-to-end with New Visa Express.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  },
  {
    label: "Step 04 — Growth",
    title: "Outcomes compound",
    desc: "Enrolment grows, trust compounds and the network expands — for every partner.",
    icon: <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />,
  },
];

const brandGradient = "linear-gradient(135deg, #14B57E, #0B5E46)";

export default function PartnershipPage() {
  return (
    <>
      <Nav />
      <main>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          className="pt-[150px] pb-[80px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 90% 6%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 4% 92%, rgba(20,181,126,0.07), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1fr_1fr] gap-[60px] lg:gap-[40px] items-center">
            <div className="max-w-[640px]">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                GLOBAL PARTNERSHIPS
              </div>

              <h1
                className="font-display font-medium leading-[1.15] tracking-[-0.02em] text-balance"
                style={{ fontSize: "clamp(28px,3.4vw,42px)", color: "var(--ink)" }}
              >
                FlyBridge — Connecting Students,{" "}
                <span style={{ color: "var(--brand-2)" }}>Universities &amp; success.</span>
              </h1>

              <p className="mt-[22px] max-w-[540px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                FlyBridge connects ambitious students with 50+ universities across the United States and
                Canada, alongside world-class expertise from IDP and the British Council — turning
                international ambition into a clear, credible path forward.
              </p>

              <div className="flex items-center gap-5 mt-[34px] flex-wrap">
                <a
                  href="#become-partner"
                  className="inline-flex items-center gap-[9px] font-medium text-[15px] text-white rounded-full px-[26px] py-[15px] transition-all duration-250 hover:translate-y-[-1px]"
                  style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(15,169,104,0.5)" }}
                >
                  Partner with FlyBridge
                  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a href="#universities" className="inline-flex items-center gap-3 font-medium text-[15px]" style={{ color: "var(--ink)" }}>
                  <span className="w-[42px] h-[42px] rounded-full flex items-center justify-center border border-line bg-white">
                    <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  See our university network
                </a>
              </div>

              <div className="mt-[34px] flex items-center gap-3">
                <span
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-display font-semibold text-[11px] text-white"
                  style={{ background: "linear-gradient(135deg, #0B5E46, #06382C)" }}
                >
                  NV
                </span>
                <p className="text-[13px]" style={{ color: "var(--body)" }}>
                  Proudly backed by{" "}
                  <a
                    href="https://newvisaexpress.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium"
                    style={{ color: "var(--ink)" }}
                  >
                    New Visa Express
                  </a>
                </p>
              </div>
            </div>

            {/* Visual: partnership workflow */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-10 rounded-[48px]" style={{ background: "radial-gradient(460px 320px at 60% 30%, rgba(15,169,104,0.1), transparent 65%)" }} />

              <div
                className="relative rounded-lg border border-line bg-white/90 backdrop-blur-[2px] p-7 md:p-8"
                style={{ boxShadow: "0 40px 80px -40px rgba(18,32,67,0.25)" }}
              >
                <div className="flex items-center justify-between gap-4 mb-7">
                  <div>
                    <div className="font-mono text-[10px] font-medium tracking-[0.45em] uppercase" style={{ color: "var(--brand-2)" }}>
                      How partnership works
                    </div>
                    <div className="text-[15px] font-medium mt-[6px]" style={{ color: "var(--ink)" }}>
                      From first call to first cohort
                    </div>
                  </div>
                  <span className="w-[10px] h-[10px] rounded-full shrink-0" style={{ background: "var(--brand-2)", boxShadow: "0 0 0 4px rgba(15,169,104,0.15)" }} />
                </div>

                <div className="relative">
                  <div className="absolute left-[21px] top-[6px] bottom-[6px] w-[2px] rounded-full" style={{ background: "var(--line)" }} />
                  <div
                    className="fb-workflow-line absolute left-[21px] top-[6px] bottom-[6px] w-[2px] rounded-full"
                    style={{ background: "linear-gradient(180deg, #14B57E, #0FA968)", transformOrigin: "top" }}
                  />

                  {workflowSteps.map((step, i) => (
                    <div
                      key={step.title}
                      className="fb-step-in relative flex gap-5 pb-8 last:pb-0"
                      style={{ animationDelay: `${0.5 + i * 0.85}s` }}
                    >
                      <div className="relative shrink-0">
                        <span
                          className="w-[44px] h-[44px] rounded-lg border border-line bg-white flex items-center justify-center"
                          style={{ boxShadow: "0 10px 24px -14px rgba(18,32,67,0.25)" }}
                        >
                          <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            {step.icon}
                          </svg>
                        </span>
                        <span className="fb-pulse absolute left-[21px] top-[46px] w-[3px] h-[3px] -translate-x-1/2 rounded-full" style={{ background: "var(--brand)" }} />
                      </div>
                      <div className="min-w-0 pt-[2px]">
                        <div className="font-mono text-[9.5px] font-medium tracking-[0.35em] uppercase" style={{ color: "var(--body)" }}>
                          {step.label}
                        </div>
                        <div className="font-display font-semibold text-[16px] mt-[5px]" style={{ color: "var(--ink)" }}>
                          {step.title}
                        </div>
                        <p className="text-[13px] leading-[1.6] mt-[5px]" style={{ color: "var(--body)" }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* floating badge */}
              <div
                className="absolute -top-6 -right-5 flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
                style={{ boxShadow: "0 24px 44px -24px rgba(18,32,67,0.3)" }}
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
                  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <div>
                  <div className="font-display font-semibold text-[16px] leading-none" style={{ color: "var(--ink)" }}>10,000+</div>
                  <div className="font-mono text-[9px] tracking-[1px] mt-[5px] uppercase" style={{ color: "var(--body)" }}>Learners guided</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PARTNER MARQUEE ──────────────────────────────────── */}
        <section className="border-y border-line bg-white py-8 overflow-hidden relative">
          <div className="fb-marquee flex w-full overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)" }}>
            <div className="fb-marquee-track flex items-center gap-[14px] pr-[14px] shrink-0">
              {[...marqueeNames, ...marqueeNames].map((name, i) => (
                <div
                  key={`${name}-${i}`}
                  className="flex items-center gap-2.5 rounded-full border border-line bg-white px-6 py-[11px] whitespace-nowrap"
                  style={{ boxShadow: "0 6px 16px -12px rgba(18,32,67,0.12)" }}
                >
                  <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                  <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)", opacity: 0.85 }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── STATS ───────────────────────────────────────────── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[70px] pb-[70px]">
          <div className="max-w-[1320px] mx-auto rounded-lg border border-line px-[24px] py-[38px]" style={{ background: "var(--bg-soft)" }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-[36px]">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center text-center px-4">
                  <div className="flex items-baseline gap-[8px]">
                    <span className="font-display font-semibold text-[clamp(32px,3.6vw,44px)] leading-none tracking-[-0.03em]" style={{ color: "var(--ink)" }}>
                      {stat.value}
                    </span>
                    <span className="w-[7px] h-[7px] rounded-full self-center" style={{ background: "var(--brand)" }} />
                  </div>
                  <div className="font-mono text-[11px] font-medium tracking-[0.4px] uppercase mt-[12px]" style={{ color: "var(--body)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── UNIVERSITY NETWORK ──────────────────────────────── */}
        <section id="universities" className="px-[clamp(20px,4.5vw,56px)] pb-[70px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
              <div>
                <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                  UNIVERSITY NETWORK
                </div>
                <h2
                  className="font-display font-semibold tracking-[-0.01em] max-w-[560px]"
                  style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
                >
                  50+ universities across the US and Canada
                </h2>
              </div>
              <p className="text-[15px] max-w-[380px]" style={{ color: "var(--body)" }}>
                From research powerhouses to career-focused institutions, our partner universities give
                students real, credible pathways into North American higher education.
              </p>
            </div>

            <div
              className="rounded-lg border border-line bg-white overflow-hidden"
              style={{ boxShadow: "0 24px 50px -34px rgba(18,32,67,0.22)" }}
            >
              {universities.map((u, i) => (
                <div
                  key={u.name}
                  className={`group flex items-center gap-4 sm:gap-6 px-6 sm:px-8 py-[17px] transition-colors duration-250 ${i > 0 ? "border-t border-line" : ""} hover:bg-brand-soft/50`}
                >
                  <span className="font-mono text-[11px] w-[26px] shrink-0" style={{ color: "var(--body)", opacity: 0.6 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium truncate" style={{ color: "var(--ink)" }}>
                      {u.name}
                    </div>
                  </div>
                  <span
                    className="font-mono text-[10px] font-medium tracking-[0.4px] uppercase px-3 py-[6px] rounded-full border shrink-0"
                    style={{ color: "var(--body)", borderColor: "var(--line)" }}
                  >
                    {u.country}
                  </span>
                  <svg
                    className="w-[15px] h-[15px] shrink-0 opacity-0 -translate-x-[6px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-250"
                    viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                  </svg>
                </div>
              ))}

              <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-[18px] border-t border-dashed" style={{ borderColor: "var(--line)" }}>
                <span className="text-[13.5px]" style={{ color: "var(--body)" }}>
                  …and 40+ more institutions across the United States &amp; Canada
                </span>
                <a href="#become-partner" className="inline-flex items-center gap-2 font-medium text-[14px] shrink-0" style={{ color: "var(--brand-2)" }}>
                  Join the network
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── STRATEGIC PARTNERS ──────────────────────────────── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[80px]">
          <div className="max-w-[1320px] mx-auto rounded-lg border border-line px-[clamp(20px,4.5vw,56px)] py-[70px]" style={{ background: "var(--bg-soft)" }}>
            <div className="mb-10">
              <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                STRATEGIC PARTNERS
              </div>
              <h2
                className="font-display font-semibold tracking-[-0.01em] max-w-[560px]"
                style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
              >
                World-class expertise, built into every journey
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {strategicPartners.map((p) => (
                <div
                  key={p.name}
                  className="rounded-lg border border-line bg-white p-7 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center font-display font-semibold text-[14px] text-white" style={{ background: brandGradient }}>
                      {p.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-[17px]" style={{ color: "var(--ink)" }}>{p.name}</div>
                      <div className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase mt-[3px]" style={{ color: "var(--brand-2)" }}>
                        {p.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-[14.5px] leading-[1.7]" style={{ color: "var(--body)" }}>{p.desc}</p>
                </div>
              ))}
            </div>

            {/* Backer card */}
            <div
              className="mt-6 rounded-lg border border-line bg-white p-7 md:p-9 flex flex-col md:flex-row md:items-center gap-6 md:gap-9 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
              style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
            >
              <div className="w-[60px] h-[60px] shrink-0 rounded-lg flex items-center justify-center font-display font-semibold text-[16px] text-white" style={{ background: "linear-gradient(135deg, #0B5E46, #06382C)" }}>
                NV
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="font-display font-semibold text-[17px]" style={{ color: "var(--ink)" }}>
                    Backed by{" "}
                    <a
                      href="https://newvisaexpress.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--brand-2)" }}
                    >
                      New Visa Express
                    </a>
                  </div>
                  <span className="font-mono text-[9.5px] font-medium tracking-[0.4px] px-3 py-[6px] rounded-full uppercase" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                    Group backer
                  </span>
                </div>
                <p className="text-[14.5px] leading-[1.7] mt-2 max-w-[640px]" style={{ color: "var(--body)" }}>
                  Every FlyBridge program sits on the foundation of New Visa Express — a visa and study
                  abroad group whose expertise strengthens our application, documentation and post-arrival
                  support across every market we serve.
                </p>
              </div>
              <a href="https://newvisaexpress.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-[14.5px] shrink-0 self-start md:self-auto" style={{ color: "var(--brand-2)" }}>
                Visit newvisaexpress.com
                <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── BECOME A PARTNER ────────────────────────────────── */}
        <section id="become-partner" className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div
              className="rounded-lg p-10 md:p-16 text-center relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                backgroundSize: "36px 36px, 36px 36px, auto",
              }}
            >
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="absolute bottom-0 left-0 w-[240px] h-[240px] rounded-full blur-[90px] translate-y-1/2 -translate-x-1/2" style={{ background: "rgba(255,255,255,0.07)" }} />

              <div className="relative">
                <div className="font-mono text-mono-sm font-medium tracking-[0.2em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Become a Partner
                </div>
                <h2 className="font-display text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance mx-auto max-w-[660px]">
                  Let&apos;s build the next chapter of global education, together
                </h2>
                <p className="text-[16.5px] leading-[1.65] mx-auto max-w-[560px] mt-4 mb-10" style={{ color: "rgba(255,255,255,0.85)" }}>
                  We&apos;re always looking to grow our network — universities, language institutes and
                  education organizations who share our commitment to giving students real, credible
                  pathways abroad. If that&apos;s you, let&apos;s talk.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-9">
                  <a
                    href="tel:+17786768459"
                    className="inline-flex items-center gap-2.5 font-medium text-[15px] rounded-full px-[28px] py-[14px] transition-all duration-250 hover:translate-y-[-1px]"
                    style={{ background: "#ffffff", color: "#0B5E46", boxShadow: "0 16px 28px -14px rgba(0,0,0,0.4)" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Talk to our partnerships team
                  </a>
                  <a
                    href="mailto:partnership@flybridge.com"
                    className="inline-flex items-center gap-2.5 font-medium text-[15px] rounded-full px-[28px] py-[14px] border transition-all duration-250 hover:bg-white/10 hover:translate-y-[-1px]"
                    style={{ borderColor: "rgba(255,255,255,0.4)", color: "#ffffff" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 5L2 7" />
                    </svg>
                    Send us an email
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 font-mono text-[12px] font-medium tracking-[0.3px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: "#4ADE9F" }} />
                    We respond within 24 hours
                  </span>
                  <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                  <span>+1 778 676 8459</span>
                  <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                  <span>partnership@flybridge.com</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
