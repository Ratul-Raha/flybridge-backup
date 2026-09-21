"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";

const faqGroups = [
  {
    id: "general",
    number: "01",
    label: "General",
    title: "General questions",
    questions: [
      {
        q: "What is FlyBridge Education Group?",
        a: "FlyBridge Education Group Inc. is an education group headquartered in Toronto, Canada that helps ambitious international students build an international future — from English language preparation to university placement and beyond.",
      },
      {
        q: "Where is FlyBridge located?",
        a: "Our head office is at 757 Gladstone Avenue, Toronto, ON M6H 3J5, Canada, with partner hubs operating across South Asia.",
      },
      {
        q: "Who is FlyBridge for?",
        a: "FlyBridge is for students and professionals who want to study, work, or build a career abroad — whether you are starting your language journey or ready to apply to universities.",
      },
    ],
  },
  {
    id: "programs",
    number: "02",
    label: "Programs",
    title: "Programs & courses",
    questions: [
      {
        q: "How do the online courses work?",
        a: "Each course is self-paced and video-based. You can learn on your own schedule, track your progress in the dashboard, and earn a certificate when you complete it.",
      },
      {
        q: "Do I need to be fluent in English before starting?",
        a: "No. Our programs include English language preparation through Dream Language Institute, so you can start at the level that matches your current ability.",
      },
      {
        q: "Are the courses accredited?",
        a: "Courses are delivered by experienced instructors and include completion certificates. Program-specific accreditation details are shared on each course page.",
      },
    ],
  },
  {
    id: "admissions",
    number: "03",
    label: "Admissions",
    title: "Admissions & placement",
    questions: [
      {
        q: "How do I get started?",
        a: "Create a free account, pick the program that matches your goal, and start your first lesson. Our team also offers pre-screening to match you with the right pathway.",
      },
      {
        q: "Can you help with university applications and visas?",
        a: "Yes. Through New Visa Express we provide academic placement, credential evaluation and visa guidance from application to arrival.",
      },
      {
        q: "Do you support students outside Canada?",
        a: "We support ambitious students around the world, especially across South Asia, throughout their journey abroad.",
      },
    ],
  },
  {
    id: "support",
    number: "04",
    label: "Support",
    title: "Fees, payment & support",
    questions: [
      {
        q: "How do payments work?",
        a: "Payments are processed securely through trusted third-party gateways. We do not store your credit card information directly.",
      },
      {
        q: "What if I need help mid-course?",
        a: "You can reach our support team anytime — via WhatsApp, phone at +1 778 676 8459, or email. A real person will help you get back on track.",
      },
      {
        q: "Can I get a refund?",
        a: "Yes — every course purchase comes with a 3-day full refund window. If you are not satisfied within 3 days, you can claim a 100% refund. Refunds are processed within 7–15 business days. See our refund policy for details.",
      },
    ],
  },
];

const contacts = [
  { label: "Email", value: "support@flybridgeedu.com", href: "mailto:support@flybridgeedu.com" },
  { label: "Phone / WhatsApp", value: "+1 (778) 676-8459", href: "tel:+17786768459" },
  { label: "WhatsApp", value: "+1 (778) 676-8459", href: "https://wa.me/17786768459" },
];

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <Nav />
      <main>
        <section
          className="pt-[150px] pb-[80px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 90% 6%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 4% 92%, rgba(47,95,224,0.06), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="max-w-[1320px] mx-auto">
            <div className="max-w-[720px]">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                FAQ
              </div>

              <h1
                className="font-display font-medium leading-[1.12] tracking-[-0.02em] text-balance"
                style={{ fontSize: "clamp(30px,3.8vw,48px)", color: "var(--ink)" }}
              >
                Frequently asked{" "}
                <span style={{ color: "var(--brand-2)" }}>questions.</span>
              </h1>

              <p className="mt-[24px] max-w-[560px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                Everything you need to know about FlyBridge programs, admissions, and support. Can&apos;t
                find your answer? Just ask us — a real person will reply.
              </p>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-14">
            <aside className="lg:sticky lg:top-[110px] lg:self-start hidden lg:block">
              <div className="rounded-lg border border-line bg-white p-6" style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}>
                <div className="font-mono text-[10px] font-medium tracking-[0.4em] uppercase mb-5" style={{ color: "var(--body)" }}>
                  On this page
                </div>
                <ul className="space-y-1">
                  {faqGroups.map((g) => (
                    <li key={g.id}>
                      <a
                        href={`#${g.id}`}
                        className="group flex items-center gap-3 rounded-xl px-3.5 py-[10px] text-[13.5px] font-medium transition-all duration-250 hover:bg-bg-soft"
                        style={{ color: "var(--ink)" }}
                      >
                        <span className="font-mono text-[10.5px] font-medium text-body opacity-50">
                          {g.number}
                        </span>
                        {g.label}
                        <span className="ml-auto font-mono text-[10.5px] text-body opacity-40">
                          {g.questions.length}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:support@flybridgeedu.com"
                  className="mt-5 flex items-center justify-center gap-2 font-medium text-[13.5px] rounded-full py-[10px] transition-all duration-300 hover:translate-y-[-1px]"
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
                {faqGroups.map((g) => (
                  <a
                    key={g.id}
                    href={`#${g.id}`}
                    className="shrink-0 rounded-full border border-line px-4 py-2 font-mono text-[11px] font-medium tracking-[0.2px]"
                    style={{ color: "var(--body)" }}
                  >
                    {g.number} · {g.label}
                  </a>
                ))}
              </div>

              <div className="space-y-14 md:space-y-16">
                {faqGroups.map((g) => (
                  <section key={g.id} id={g.id} className="relative scroll-mt-[110px]">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                      <div className="font-mono text-[10.5px] font-medium tracking-[0.4em] uppercase" style={{ color: "var(--brand-2)" }}>
                        {g.number} — {g.label}
                      </div>
                    </div>
                    <h2 className="font-display font-semibold tracking-[-0.01em] mb-6" style={{ fontSize: "clamp(24px,2.8vw,30px)", color: "var(--ink)" }}>
                      {g.title}
                    </h2>

                    <div className="space-y-3">
                      {g.questions.map((item, i) => {
                        const id = `${g.id}-${i}`;
                        const expanded = open === id;
                        return (
                          <div
                            key={id}
                            className="rounded-lg border bg-white transition-all duration-300"
                            style={{
                              borderColor: expanded ? "var(--brand-2)" : "var(--line)",
                              boxShadow: expanded ? "0 12px 28px -18px rgba(18,32,67,0.25)" : "0 4px 16px -12px rgba(18,32,67,0.08)",
                            }}
                          >
                            <button
                              onClick={() => setOpen(expanded ? null : id)}
                              aria-expanded={expanded}
                              className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
                            >
                              <span className="text-[15.5px] font-medium leading-snug" style={{ color: "var(--ink)" }}>
                                {item.q}
                              </span>
                              <span
                                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-transform duration-300"
                                style={{
                                  background: expanded ? "var(--brand)" : "var(--bg-soft)",
                                  transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
                                }}
                              >
                                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M12 5v14M5 12h14" stroke={expanded ? "#fff" : "var(--body)"} />
                                </svg>
                              </span>
                            </button>
                            {expanded && (
                              <div className="px-6 pb-5 -mt-1">
                                <p className="text-[14px] leading-[1.7] max-w-[640px]" style={{ color: "var(--body)" }}>
                                  {item.a}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}

                <section className="relative">
                  <div
                    className="rounded-lg p-10 md:p-14 relative overflow-hidden"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                      backgroundSize: "36px 36px, 36px 36px, auto",
                    }}
                  >
                    <div className="absolute top-0 right-0 w-[280px] h-[280px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.1)" }} />

                    <div className="relative">
                      <div className="font-mono text-mono-sm font-medium tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                        Still have questions?
                      </div>
                      <h2 className="font-display text-[clamp(26px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance max-w-[560px]">
                        We&apos;re here to help.
                      </h2>
                      <p className="text-[15.5px] leading-[1.65] max-w-[500px] mt-4 mb-9" style={{ color: "rgba(255,255,255,0.85)" }}>
                        Reach out through any channel below — a real person on our team will get back to you.
                      </p>

                      <div className="grid sm:grid-cols-3 gap-4">
                        {contacts.map((c) => (
                          <a
                            key={c.label}
                            href={c.href}
                            target={c.href.startsWith("http") ? "_blank" : undefined}
                            rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-[2px] transition-all duration-300 hover:bg-white/15 hover:-translate-y-1"
                          >
                            <div className="font-mono text-[9.5px] font-medium tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
                              {c.label}
                            </div>
                            <div className="text-[13.5px] font-medium mt-[4px] leading-[1.5]" style={{ color: "#fff" }}>{c.value}</div>
                          </a>
                        ))}
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