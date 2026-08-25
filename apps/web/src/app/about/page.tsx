import type { Metadata } from "next";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "About | FlyBridge Education Group",
  description:
    "FlyBridge Education Group Inc. bridges international students to top educational institutions across Canada and the world — with 12+ years of student recruitment and counseling experience.",
};

const stats = [
  { value: "12+", label: "Years of experience" },
  { value: "50+", label: "Partner universities" },
  { value: "10,000+", label: "Students supported" },
  { value: "2", label: "Global strategic partners" },
];

const ecosystem = [
  {
    title: "Dream Language Institute",
    role: "English language preparation",
    desc: "Our specialized English language preparation hubs, equipping students with the proficiency needed for global academic success.",
    initials: "DL",
    gradient: "linear-gradient(135deg, #6B4CE0, #4A2FC0)",
  },
  {
    title: "New Visa Express",
    role: "Student counseling network",
    desc: "Providing transparent academic placement, credential evaluation and visa guidance to ambitious students across South Asia.",
    initials: "NV",
    gradient: "linear-gradient(135deg, #0B5E46, #06382C)",
  },
];

const steps = [
  {
    title: "Pre-screen",
    desc: "We evaluate academic background, goals and readiness to match each student with the right pathway.",
    icon: <path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />,
  },
  {
    title: "Train",
    desc: "Language preparation through Dream Language Institute and career readiness through practical courses.",
    icon: <path d="M4 4H14V20H4V4Z" />,
  },
  {
    title: "Support",
    desc: "End-to-end guidance — applications, credential evaluation and visa processing with New Visa Express.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  },
];

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        <section
          className="pt-[150px] pb-[80px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 90% 6%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 4% 92%, rgba(107,76,224,0.07), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="max-w-[1320px] mx-auto">
            <div className="max-w-[760px]">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                ABOUT US
              </div>

              <h1
                className="font-display font-medium leading-[1.12] tracking-[-0.02em] text-balance"
                style={{ fontSize: "clamp(30px,3.8vw,46px)", color: "var(--ink)" }}
              >
                About FlyBridge —{" "}
                <span style={{ color: "var(--brand-2)" }}>connecting students, universities &amp; success.</span>
              </h1>

              <p className="mt-[24px] max-w-[620px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                At FlyBridge Education Group Inc., our mission is to bridge international students to top
                educational institutions across Canada and around the world.
              </p>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[70px]">
          <div className="max-w-[1320px] mx-auto rounded-2xl border border-line px-[24px] py-[38px]" style={{ background: "var(--bg-soft)" }}>
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

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px]">
          <div className="max-w-[1320px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                WHO WE ARE
              </div>
              <h2 className="font-display font-semibold tracking-[-0.01em] max-w-[520px]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
                A seamless, end-to-end pathway for aspiring international students
              </h2>
              <p className="mt-[22px] text-[15.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                With over 12 years of experience in student recruitment and academic counseling, we provide
                a seamless, end-to-end pathway for aspiring international students. Headquartered in
                Toronto, Canada, we operate a fully integrated educational ecosystem across South Asia,
                covering everything from language preparation to university placement.
              </p>
              <p className="mt-[18px] text-[15.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                We pre-screen, train, and support ambitious students every step of the way — ensuring they
                transition smoothly from language preparation to higher education abroad.
              </p>
            </div>

            <div className="space-y-5">
              {ecosystem.map((e) => (
                <div
                  key={e.title}
                  className="rounded-xl border border-line bg-white p-7 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center font-display font-semibold text-[14px] text-white"
                      style={{ background: e.gradient }}
                    >
                      {e.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-[17px]" style={{ color: "var(--ink)" }}>{e.title}</div>
                      <div className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase mt-[3px]" style={{ color: "var(--brand-2)" }}>
                        {e.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-[14.5px] leading-[1.7]" style={{ color: "var(--body)" }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px]">
          <div className="max-w-[1320px] mx-auto rounded-2xl border border-line px-[clamp(20px,4.5vw,56px)] py-[70px]" style={{ background: "var(--bg-soft)" }}>
            <div className="mb-10">
              <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                HOW WE SUPPORT STUDENTS
              </div>
              <h2
                className="font-display font-semibold tracking-[-0.01em] max-w-[560px]"
                style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
              >
                Supported every step of the way
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 md:gap-6">
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  className="rounded-xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
                      <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {s.icon}
                      </svg>
                    </span>
                    <span className="font-mono text-[11px] font-medium" style={{ color: "var(--body)", opacity: 0.6 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-[16px]" style={{ color: "var(--ink)" }}>{s.title}</h3>
                  <p className="text-[13.5px] leading-[1.65] mt-2" style={{ color: "var(--body)" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div
              className="rounded-2xl p-10 md:p-16 text-center relative overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                backgroundSize: "36px 36px, 36px 36px, auto",
              }}
            >
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.1)" }} />

              <div className="relative">
                <div className="font-mono text-mono-sm font-medium tracking-[0.2em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.75)" }}>
                  FlyBridge Education Group Inc.
                </div>
                <h2 className="font-display text-[clamp(26px,3.2vw,36px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance mx-auto max-w-[620px]">
                  Registered in Ontario, Canada
                </h2>
                <p className="text-[16.5px] leading-[1.65] mx-auto max-w-[520px] mt-4 mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Ontario Corporation Number
                </p>
                <div
                  className="inline-flex items-center gap-2 font-mono text-[15px] font-semibold tracking-[0.15em] text-white rounded-full px-7 py-3 mt-2"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  OCN: 1001686187
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
