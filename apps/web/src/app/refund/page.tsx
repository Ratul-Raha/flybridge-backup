import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Swords,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Refund Policy | FlyBridge Education Group",
  description:
    "Every course comes with a 3-day, 100% money-back guarantee. Claim your refund online in minutes — no questions asked, no support ticket required.",
};

/* ───────────────────────── policy facts ───────────────────────── */

const snapshot = [
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Money back guarantee",
    sub: "Every single course purchase is covered.",
  },
  {
    icon: CalendarCheck,
    value: "3 days",
    label: "Refund window",
    sub: "Claim within 3 days of your purchase.",
  },
  {
    icon: Clock,
    value: "7–15 days",
    label: "To your account",
    sub: "Refunds land back within 7–15 business days.",
  },
  {
    icon: CreditCard,
    value: "Online",
    label: "Self-serve claim",
    sub: "Claim from My Orders on your dashboard.",
  },
];

const process = [
  {
    number: "01",
    icon: Swords,
    title: "Not your thing?",
    desc: "Try the course risk-free. If it isn't right for you within the first 3 days, open My Orders on your dashboard and tap Request refund.",
  },
  {
    number: "02",
    icon: CheckCircle2,
    title: "Automatic approval",
    desc: "Card refunds are sent back to your original payment method automatically. Mobile wallet payouts are approved by our team, usually within one working day.",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Money back",
    desc: "The full amount is returned to your original payment method within 7–15 business days.",
  },
];

const faqs = [
  {
    q: "Which purchases are covered?",
    a: "Every paid course on FlyBridge is covered. Free resources and courses marked as free are not refundable since nothing is paid for them.",
  },
  {
    q: "How is the 3-day window calculated?",
    a: "It starts from the moment your payment is completed. You have 3 full days to decide, and any claim raised within that window is approved in full.",
  },
  {
    q: "How do I request a refund?",
    a: "Open My Orders in your dashboard, find the purchase, and tap Request refund. You'll see a live countdown of the time you have left, and your refund-safe lesson and mock exam usage on the same card.",
  },
  {
    q: "Does using the course affect my refund?",
    a: "Yes. Your first 5 lessons and your first mock exam are on us. If you play more than 5 lessons, or more than 1 mock exam, that purchase is no longer refundable — the option simply disappears from My Orders, and your course access stays as it is. Nothing is locked while you browse; the counters only decide refund eligibility.",
  },
  {
    q: "How long do refunds take?",
    a: "Once approved, refunds reach your account within 7–15 business days. Exact timing depends on your bank or payment provider.",
  },
  {
    q: "Can I get a refund after 3 days?",
    a: "The 3-day guarantee covers every purchase. After that window, refunds are reviewed case-by-case. Just contact us and we'll do our best to help.",
  },
  {
    q: "Do you keep any fees?",
    a: "No. We refund 100% of the amount you paid — no processing fees, no hidden charges.",
  },
];

const contactCards = [
  {
    icon: Mail,
    label: "Email support",
    value: "hello@flybridgeedu.com",
    href: "mailto:hello@flybridgeedu.com",
  },
  {
    icon: Phone,
    label: "Call or WhatsApp",
    value: "+1 (778) 676-8459",
    href: "tel:+17786768459",
  },
  {
    icon: MapPin,
    label: "Head office",
    value: "Toronto, Ontario, Canada",
    href: "https://maps.google.com/?q=757+Gladstone+Avenue+Toronto",
    external: true,
  },
];

export default function RefundPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section
          className="relative px-[clamp(20px,4.5vw,56px)] pt-[clamp(130px,18vh,190px)] pb-[clamp(56px,7vw,88px)] overflow-hidden"
          style={{ background: "linear-gradient(180deg, #FFFFFF 0%, var(--bg-soft) 100%)" }}
        >
          <div
            className="pointer-events-none absolute -top-32 right-0 w-[520px] h-[520px] rounded-full blur-[120px]"
            style={{ background: "rgba(20,181,126,0.12)" }}
          />
          <div className="relative max-w-[860px] mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] px-4 py-2 mb-7"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
            >
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
              MONEY-BACK GUARANTEE
            </div>
            <h1
              className="font-display font-semibold tracking-[-0.02em] leading-[1.08] text-balance"
              style={{ fontSize: "clamp(36px,5.5vw,62px)", color: "var(--ink)" }}
            >
              Loved it or your money back,{" "}
              <span style={{ color: "var(--brand-2)" }}>within 3 days.</span>
            </h1>
            <p className="mt-6 text-[17px] leading-[1.75] max-w-[620px] mx-auto" style={{ color: "var(--body)" }}>
              Learning is a leap of faith — so we removed the risk. Every course on
              FlyBridge carries a 3-day, 100% refund guarantee. Don&apos;t like it?
              Claim your refund online. No questions, no calls, no hassle.
            </p>

            {/* Snapshot stats */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {snapshot.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border bg-white p-5 text-left transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_36px_-18px_rgba(18,32,67,0.18)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4"
                    style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                  >
                    <s.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                  </span>
                  <div className="font-display text-[24px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                    {s.value}
                  </div>
                  <div className="text-[13px] font-semibold mt-1.5" style={{ color: "var(--ink)" }}>
                    {s.label}
                  </div>
                  <div className="text-[12.5px] leading-[1.5] mt-1" style={{ color: "var(--body)" }}>
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-[clamp(20px,4.5vw,56px)] py-[clamp(64px,8vw,104px)]">
          <div className="max-w-[1020px] mx-auto">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] px-4 py-2 mb-5"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                HOW IT WORKS
              </div>
              <h2
                className="font-display font-semibold tracking-[-0.01em] text-balance"
                style={{ fontSize: "clamp(28px,3.6vw,40px)", color: "var(--ink)" }}
              >
                Three steps. Zero friction.
              </h2>
              <p className="mt-4 text-[15.5px] max-w-[520px] mx-auto" style={{ color: "var(--body)" }}>
                Refunds on FlyBridge are automatic — they never depend on getting hold of support.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {process.map((step, i) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl border bg-white p-7"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                    >
                      <step.icon className="w-[20px] h-[20px]" strokeWidth={1.9} />
                    </span>
                    <span className="font-mono text-[13px] font-bold" style={{ color: "var(--brand-2)" }}>
                      STEP {step.number}
                    </span>
                  </div>
                  <h3
                    className="font-display text-[18px] font-semibold leading-[1.35]"
                    style={{ color: "var(--ink)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-[1.75]" style={{ color: "var(--body)" }}>
                    {step.desc}
                  </p>
                  {i < process.length - 1 && (
                    <span
                      className="hidden sm:block absolute top-1/2 -right-4 w-3 h-3 rotate-45 -translate-y-1/2"
                      style={{ background: "#fff", borderRight: "1.5px solid var(--line)", borderTop: "1.5px solid var(--line)" }}
                      aria-hidden
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Legend banner */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[clamp(64px,8vw,104px)]">
          <div className="max-w-[1020px] mx-auto">
            <div
              className="relative overflow-hidden rounded-2xl p-[clamp(28px,4vw,48px)]"
              style={{
                background:
                  "linear-gradient(135deg, #0B5E46 0%, #0E7A55 55%, #14B57E 120%)",
              }}
            >
              <div
                className="pointer-events-none absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"
                style={{ background: "rgba(255,255,255,0.12)" }}
              />
              <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] gap-10 lg:gap-16 items-center">
                <div>
                  <div className="font-mono text-[11.5px] font-medium tracking-[0.22em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>
                    GOOD TO KNOW
                  </div>
                  <h2
                    className="font-display font-semibold text-white leading-[1.25]"
                    style={{ fontSize: "clamp(26px,3.2vw,36px)" }}
                  >
                    The parts that matter most.
                  </h2>
                  <div className="mt-6 space-y-4">
                    {[
                      { k: "Coverage", v: "All paid courses, automatically." },
                      { k: "Eligibility", v: "Any purchase, within 3 days of payment." },
                      { k: "Free usage", v: "First 5 lessons and 1 mock exam are on us." },
                      { k: "Approval", v: "Card refunds are automatic; wallets are approved by us." },
                      { k: "Refund amount", v: "100%, never minus a fee." },
                    ].map((row) => (
                      <div
                        key={row.k}
                        className="flex items-baseline gap-4 pb-4"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.16)" }}
                      >
                        <span className="text-[13px] font-bold text-white/90 w-[110px] shrink-0">{row.k}</span>
                        <span className="text-[14px]" style={{ color: "rgba(255,255,255,0.85)" }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-2xl p-7 backdrop-blur-[2px]"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)" }}
                >
                  <div className="text-[15px] font-semibold text-white">The 3-day rule</div>
                  <div className="mt-2 text-[13.5px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Your refund window starts the moment payment is completed. Raise a
                    claim any time within those 3 days and you get 100% back.
                  </div>
                    <ul className="mt-5 space-y-2.5">
                    {[
                      "No forms to fill in",
                      "Claim straight from My Orders",
                      "Refund to your original payment method",
                      "Play 5 lessons and 1 mock exam on us",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-[13.5px] font-medium text-white">
                        <CheckCircle2 className="w-[17px] h-[17px] mt-[1px] shrink-0" style={{ color: "#7CF0BD" }} strokeWidth={2.4} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[clamp(64px,8vw,104px)]">
          <div className="max-w-[820px] mx-auto">
            <div className="text-center mb-11">
              <div
                className="inline-flex items-center gap-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] px-4 py-2 mb-5"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <HelpCircle className="w-[13px] h-[13px]" strokeWidth={2.2} />
                FAQ
              </div>
              <h2
                className="font-display font-semibold tracking-[-0.01em]"
                style={{ fontSize: "clamp(26px,3.2vw,36px)", color: "var(--ink)" }}
              >
                Questions, answered.
              </h2>
            </div>

            <div className="space-y-3.5">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="refund-faq rounded-xl border bg-white px-6 md:px-7 py-5"
                  style={{ borderColor: "var(--line)" }}
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                    <span className="font-display text-[15.5px] font-semibold leading-[1.4]" style={{ color: "var(--ink)" }}>
                      {f.q}
                    </span>
                    <span
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 transition-transform duration-200"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                    >
                      <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3.5 text-[14.5px] leading-[1.75]" style={{ color: "var(--body)" }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[110px]">
          <div className="max-w-[1020px] mx-auto text-center">
            <h2
              className="font-display font-semibold tracking-[-0.01em]"
              style={{ fontSize: "clamp(26px,3.2vw,36px)", color: "var(--ink)" }}
            >
              Still have a question?
            </h2>
            <p className="mt-4 text-[15.5px] max-w-[480px] mx-auto" style={{ color: "var(--body)" }}>
              Refunds are automatic, but our team is always one message away for everything else.
            </p>
            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              {contactCards.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                  className="group rounded-xl border bg-white p-6 text-center transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_36px_-18px_rgba(18,32,67,0.2)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center mx-auto mb-4 transition-colors duration-300 group-hover:bg-[var(--brand)]"
                    style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                  >
                    <c.icon className="w-[19px] h-[19px]" strokeWidth={2} />
                  </span>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
                    {c.label}
                  </div>
                  <div className="text-[15px] font-semibold mt-1.5" style={{ color: "var(--ink)" }}>
                    {c.value}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .refund-faq summary::-webkit-details-marker { display: none; }
        .refund-faq[open] summary { margin-bottom: 0; }
        .refund-faq[open] summary span:last-child { transform: rotate(45deg); }
      `}</style>
    </>
  );
}