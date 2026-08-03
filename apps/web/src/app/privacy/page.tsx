"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

const sections = [
  {
    id: "collection",
    number: "01",
    label: "Collection",
    title: "Information we collect",
    intro: "To give you access to our courses and learning tools, we collect:",
    items: [
      {
        title: "Account Info",
        desc: "Your name, email address, and profile details when you sign up.",
        icon: <path d="M17 20V18C17 15.79 15.21 14 13 14H7C4.79 14 3 15.79 3 18V20M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />,
      },
      {
        title: "Learning Data",
        desc: "Your course progress, quiz results, video lessons watched, and certificates earned.",
        icon: <path d="M6 4L20 12L6 20V4Z" />,
      },
      {
        title: "Payment Info",
        desc: "Billing details processed securely through third-party payment gateways (we do not store credit card numbers directly).",
        icon: (<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>),
      },
    ],
  },
  {
    id: "usage",
    number: "02",
    label: "Usage",
    title: "How we use your information",
    intro: "We use your data to provide a seamless learning experience:",
    items: [
      {
        title: "Course management",
        desc: "To manage your course enrollments and track your learning progress.",
        icon: <path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />,
      },
      {
        title: "Learning access",
        desc: "To provide access to study guides, downloadable templates, and video lessons.",
        icon: (<><path d="M4 4H14V20H4V4Z" /><path d="M7 8H11M7 12H11M7 16H9" /></>),
      },
      {
        title: "Communication",
        desc: "To send account updates, course announcements, and support messages.",
        icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
      },
      {
        title: "Platform improvement",
        desc: "To improve our platform content based on student usage.",
        icon: <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />,
      },
    ],
  },
  {
    id: "protection",
    number: "03",
    label: "Protection",
    title: "Data protection & sharing",
    intro: "Your data is protected with clear, transparent practices:",
    items: [
      {
        title: "No selling of data",
        desc: "We do not sell your personal information.",
        icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
      },
      {
        title: "Trusted providers only",
        desc: "Your data is only shared with trusted service providers that help us run our platform — hosting, video streaming, and secure payment processing.",
        icon: (<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>),
      },
      {
        title: "Industry-standard security",
        desc: "We use industry-standard encryption to keep your account and personal details secure.",
        icon: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
      },
    ],
  },
  {
    id: "rights",
    number: "04",
    label: "Control",
    title: "Your control & rights",
    intro: "You are always in control of your data. You can:",
    items: [
      {
        title: "Update your profile",
        desc: "Update or edit your account information inside your profile settings at any time.",
        icon: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
      },
      {
        title: "Delete your data",
        desc: "Request to delete your account and personal data from our systems.",
        icon: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />,
      },
      {
        title: "Unsubscribe anytime",
        desc: "Unsubscribe from promotional emails using the link at the bottom of any message.",
        icon: <path d="M22 9l-10 5L2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4zM2 9v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9" />,
      },
    ],
  },
];

const contacts = [
  {
    label: "Email",
    value: "privacy@flybridgeedu.com",
    href: "mailto:privacy@flybridgeedu.com",
    icon: <path d="M22 7l-10 5L2 7M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />,
  },
  {
    label: "Phone / WhatsApp",
    value: "+1 (778) 676-8459",
    href: "tel:+17786768459",
    icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
  },
  {
    label: "Location",
    value: "Toronto, Ontario, Canada",
    href: "https://maps.google.com/?q=757+Gladstone+Avenue+Toronto",
    icon: (<><path d="M20 10C20 16 12 22 12 22C12 22 4 16 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10Z" /><circle cx="12" cy="10" r="3" /></>),
  },
];

export default function PrivacyPage() {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Nav />
      <main>
        <section
          className="pt-[150px] pb-[70px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 90% 6%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 4% 92%, rgba(47,95,224,0.06), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1fr_0.85fr] gap-[60px] lg:gap-[40px] items-center">
            <div className="max-w-[640px]">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                PRIVACY POLICY
              </div>

              <h1
                className="font-display font-medium leading-[1.08] tracking-[-0.02em] text-balance"
                style={{ fontSize: "clamp(32px,4vw,52px)", color: "var(--ink)" }}
              >
                Your data,{" "}
                <span style={{ color: "var(--brand-2)" }}>your call.</span>
              </h1>

              <p className="mt-[24px] max-w-[540px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                At FlyBridge Education Group Inc., we respect your privacy and are committed to protecting
                the personal information you share with us on our learning platform — plainly explained,
                with no fine print.
              </p>

              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-[32px]">
                <div>
                  <div className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>
                    Effective date
                  </div>
                  <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>August 2026</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>
                    Entity
                  </div>
                  <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>FlyBridge Education Group Inc.</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>
                    Jurisdiction
                  </div>
                  <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>Ontario, Canada</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-[48px]" style={{ background: "radial-gradient(420px 320px at 60% 30%, rgba(15,169,104,0.08), transparent 65%)" }} />

              <div
                className="relative rounded-[28px] border border-line bg-white/90 backdrop-blur-[2px] overflow-hidden"
                style={{ boxShadow: "0 40px 80px -40px rgba(18,32,67,0.25)" }}
              >
                <div className="flex items-center justify-between px-7 py-5 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="w-[9px] h-[9px] rounded-full" style={{ background: "#F2A65A" }} />
                    <span className="w-[9px] h-[9px] rounded-full" style={{ background: "#F2C94C" }} />
                    <span className="w-[9px] h-[9px] rounded-full" style={{ background: "#27AE60" }} />
                  </div>
                  <span className="font-mono text-[10px] font-medium tracking-[0.35em] uppercase" style={{ color: "var(--body)" }}>
                    Policy · Doc FB-01
                  </span>
                </div>

                <div className="px-7 py-6 space-y-[18px]">
                  <div className="flex items-start gap-4">
                    <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>1 · Collection</div>
                      <div className="text-[14px] font-medium mt-[2px]" style={{ color: "var(--ink)" }}>Account, learning & payment data</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: "var(--blue-bg)" }}>
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="var(--blue-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>2 · Protection</div>
                      <div className="text-[14px] font-medium mt-[2px]" style={{ color: "var(--ink)" }}>We never sell your data</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: "var(--lav-bg)" }}>
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="var(--lav-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>3 · Control</div>
                      <div className="text-[14px] font-medium mt-[2px]" style={{ color: "var(--ink)" }}>Edit or delete anytime</div>
                    </div>
                  </div>

                  <div className="border-t border-dashed pt-5" style={{ borderColor: "var(--line)" }}>
                    <div className="font-mono text-[10px] tracking-[0.3px] uppercase mb-2" style={{ color: "var(--body)" }}>
                      Questions? Reach out
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-medium">
                      <a href="mailto:privacy@flybridgeedu.com" className="hover:text-brand-2 transition-colors" style={{ color: "var(--brand-2)" }}>
                        privacy@flybridgeedu.com
                      </a>
                      <a href="tel:+17786768459" style={{ color: "var(--ink)" }} className="hover:text-brand-2 transition-colors">
                        +1 (778) 676-8459
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3"
                style={{ boxShadow: "0 24px 44px -24px rgba(18,32,67,0.3)" }}
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
                  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <div>
                  <div className="font-display font-semibold text-[15px] leading-none" style={{ color: "var(--ink)" }}>GDPR-ready practices</div>
                  <div className="font-mono text-[9px] tracking-[1px] mt-[5px] uppercase" style={{ color: "var(--body)" }}>Your rights, protected</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-14">
            <aside className="lg:sticky lg:top-[110px] lg:self-start hidden lg:block">
              <div className="rounded-3xl border border-line bg-white p-6" style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}>
                <div className="font-mono text-[10px] font-medium tracking-[0.4em] uppercase mb-5" style={{ color: "var(--body)" }}>
                  On this page
                </div>
                <ul className="space-y-1">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={`group flex items-center gap-3 rounded-xl px-3.5 py-[10px] text-[13.5px] font-medium transition-all duration-250 ${
                          active === s.id ? "bg-brand-soft" : "hover:bg-bg-soft"
                        }`}
                        style={{ color: active === s.id ? "var(--brand-2)" : "var(--ink)" }}
                      >
                        <span
                          className={`font-mono text-[10.5px] font-medium transition-colors duration-250 ${
                            active === s.id ? "text-brand-2" : "text-body opacity-50"
                          }`}
                        >
                          {s.number}
                        </span>
                        {s.label}
                        {active === s.id && (
                          <span className="ml-auto w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:privacy@flybridgeedu.com"
                  className="mt-5 flex items-center justify-center gap-2 font-medium text-[13.5px] rounded-full py-[10px] transition-all duration-250 hover:translate-y-[-1px]"
                  style={{ background: "var(--brand)", color: "#fff" }}
                >
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Ask a question
                </a>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 mb-8 -mx-[clamp(20px,4.5vw,56px)] px-[clamp(20px,4.5vw,56px)]">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`shrink-0 rounded-full border px-4 py-2 font-mono text-[11px] font-medium tracking-[0.2px] transition-colors duration-250 ${
                      active === s.id ? "border-brand-2/40" : "border-line"
                    }`}
                    style={{ background: active === s.id ? "var(--brand-soft)" : "#fff", color: active === s.id ? "var(--brand-2)" : "var(--body)" }}
                  >
                    {s.number} · {s.label}
                  </a>
                ))}
              </div>

              <div className="space-y-14 md:space-y-16">
                {sections.map((s) => (
                  <section key={s.id} id={s.id} className="relative scroll-mt-[110px]">
                    <span
                      aria-hidden
                      className="absolute -top-3 -left-1 md:-left-3 font-display font-semibold leading-none pointer-events-none select-none"
                      style={{
                        fontSize: "clamp(72px,9vw,128px)",
                        color: "transparent",
                        WebkitTextStroke: "1.5px var(--line)",
                      }}
                    >
                      {s.number}
                    </span>

                    <div className="relative pt-[56px] md:pt-[64px]">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                        <div className="font-mono text-[10.5px] font-medium tracking-[0.4em] uppercase" style={{ color: "var(--brand-2)" }}>
                          {s.number} — {s.label}
                        </div>
                      </div>
                      <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(24px,2.8vw,32px)", color: "var(--ink)" }}>
                        {s.title}
                      </h2>
                      <p className="text-[15px] leading-[1.7] mt-3 mb-7 max-w-[560px]" style={{ color: "var(--body)" }}>
                        {s.intro}
                      </p>

                      <div className={`grid gap-4 ${s.items.length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                        {s.items.map((item) => (
                          <div
                            key={item.title}
                            className="rounded-2xl border border-line bg-white p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                            style={{ boxShadow: "0 4px 16px -10px rgba(18,32,67,0.08)" }}
                          >
                            <span className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--brand-soft)" }}>
                              <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                {item.icon}
                              </svg>
                            </span>
                            <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{item.title}</div>
                            <p className="text-[13px] leading-[1.65] mt-1.5" style={{ color: "var(--body)" }}>{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}

                <section id="contact" className="scroll-mt-[110px]">
                  <div
                    className="rounded-[32px] p-10 md:p-14 relative overflow-hidden"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                      backgroundSize: "36px 36px, 36px 36px, auto",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-[280px] h-[280px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.1)" }} />

                    <div className="relative">
                      <div className="font-mono text-mono-sm font-medium tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                        05 — Contact us
                      </div>
                      <h2 className="font-display text-[clamp(26px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance max-w-[560px]">
                        Questions about your account or privacy?
                      </h2>
                      <p className="text-[15.5px] leading-[1.65] max-w-[500px] mt-4 mb-9" style={{ color: "rgba(255,255,255,0.85)" }}>
                        Feel free to reach out — a real person on our team will get back to you.
                      </p>

                      <div className="grid sm:grid-cols-3 gap-4">
                        {contacts.map((c) => {
                          const inner = (
                            <>
                              <span className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
                                <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  {c.icon}
                                </svg>
                              </span>
                              <div className="font-mono text-[9.5px] font-medium tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
                                {c.label}
                              </div>
                              <div className="text-[13.5px] font-medium mt-[4px] leading-[1.5]" style={{ color: "#fff" }}>{c.value}</div>
                            </>
                          );
                          return c.href ? (
                            <a
                              key={c.label}
                              href={c.href}
                              target={c.href.startsWith("http") ? "_blank" : undefined}
                              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-[2px] transition-all duration-300 hover:bg-white/15 hover:-translate-y-1"
                            >
                              {inner}
                            </a>
                          ) : (
                            <div key={c.label} className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-[2px]">
                              {inner}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2.5 mt-9 font-mono text-[11.5px] font-medium tracking-[0.3px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                        <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#4ADE9F" }} />
                        FlyBridge Education Group Inc. · Registered in Ontario, Canada
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
