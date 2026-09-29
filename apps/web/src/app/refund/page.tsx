import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import {
  NOT_REFUNDABLE_REASON,
  REFUND_BUNDLE_MOCK_LIMIT,
  REFUND_LESSON_LIMIT,
  REFUND_MOCK_LIMIT,
  REFUND_WINDOW_DAYS,
} from "@/lib/refund-policy";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Refund Policy | FlyBridge Education Group",
  description:
    "A 3-day, 100% money-back guarantee on every FlyBridge course and mock bundle. Read the full policy: the refund window, your free lesson and mock exam allowance, why resources and seminars are non-refundable, how to claim, and how quickly you are paid.",
};

/* ───────────────────────── policy content ───────────────────────── */

const keyTerms: { term: string; detail: string; emphasis?: boolean }[] = [
  {
    term: "Guarantee",
    detail: "100% of the amount you paid, returned to your original payment method.",
    emphasis: true,
  },
  {
    term: "Refund window",
    detail: `${REFUND_WINDOW_DAYS} days, counted from the moment your payment completes.`,
    emphasis: true,
  },
  {
    term: "Eligible purchases",
    detail: "Every paid course and every paid mock bundle on FlyBridge, whatever the payment method. Resources and seminars are not covered.",
  },
  {
    term: "Your free usage on a course",
    detail: `The first ${REFUND_LESSON_LIMIT} lessons and the first ${REFUND_MOCK_LIMIT} mock exam are on us, on every course.`,
  },
  {
    term: "Your free usage on a bundle",
    detail: "Browse any mock in the bundle freely. The moment you submit a sitting, the refund for that bundle is gone.",
  },
  {
    term: "Forfeiture",
    detail: `Crossing a limit — more than ${REFUND_LESSON_LIMIT} lessons or more than ${REFUND_MOCK_LIMIT} mock exam on a course, or the first submitted mock on a bundle — makes that purchase non-refundable for good. Access is unaffected.`,
  },
  {
    term: "Not covered",
    detail: `${NOT_REFUNDABLE_REASON.resource} ${NOT_REFUNDABLE_REASON.seminar}`,
  },
  {
    term: "How to claim",
    detail: "Self-serve, from My Orders on your dashboard. No forms, no tickets, no calls.",
  },
  {
    term: "Approval",
    detail:
      "Card refunds are sent back automatically. Mobile wallet payouts are approved by our team, usually within one working day.",
  },
  {
    term: "Settlement",
    detail: "7–15 business days, depending on your bank or payment provider.",
  },
  { term: "Fees", detail: "None. We never deduct a processing or admin fee from a refund." },
];

const claimSteps = [
  {
    number: "01",
    title: "Open My Orders",
    desc: "Sign in and open My Orders in your dashboard. Every completed purchase shows a live countdown of the time you have left, plus how much of your refund-safe usage is still unused.",
  },
  {
    number: "02",
    title: "Request the refund",
    desc: "Tap Request refund and confirm. Tell us why if you would like — it helps us improve, but it is never required. The window, the usage counters and the order status are all re-checked on our servers at that moment, so the decision never rests on the button being on screen.",
  },
  {
    number: "03",
    title: "We refund you",
    desc: "Card refunds go straight back to the original payment method. Mobile wallet payouts are approved by our team, usually within one working day, and sent by us. Once the money is on its way we close the order and remove your access to the course or bundle.",
  },
];

const covered = [
  "Every paid course on FlyBridge",
  "Every paid mock bundle on FlyBridge",
  "Any payment method — bKash, Nagad, Rocket or card",
  "A full refund, with no fee deducted",
  "A reason-free claim, submitted in under a minute",
];

const notCovered = [
  "Downloadable resources and seminar seats — never refundable",
  "Free resources and courses marked as free",
  "Requests raised more than 3 days after payment",
  "Purchases once that purchase's usage limit is crossed",
  "Duplicate or fraudulent payments",
];

const faqs = [
  {
    q: "How is the 3-day window calculated?",
    a: "It starts the moment your payment is completed and runs for 3 full days. Any claim raised inside that window is approved in full — the clock is the only deadline that matters, and it is shown to you live in My Orders.",
  },
  {
    q: "What exactly counts towards the free usage?",
    a: `On a course, your first ${REFUND_LESSON_LIMIT} lessons and your first ${REFUND_MOCK_LIMIT} mock exam, per purchase. A lesson counts once, the first time you open it, and a mock exam counts once, the first time you start a new sitting. Re-watching a lesson, scrubbing back, or resuming a mock you already started costs you nothing extra.`,
  },
  {
    q: "What counts towards the free usage on a mock bundle?",
    a: `Only a submitted sitting. You can open, browse and close as many mocks in a bundle as you like and your refund stays available, because a bundle is a collection rather than a single piece of content. The refund is forfeited the moment you submit the answers to your first sitting — the allowance is ${REFUND_BUNDLE_MOCK_LIMIT} submitted mocks. If you abandon a sitting without submitting, it does not count.`,
  },
  {
    q: "Does using the course affect my refund?",
    a: `Only up to the limit. Play within ${REFUND_LESSON_LIMIT} lessons and ${REFUND_MOCK_LIMIT} mock exam and your refund stays available. Cross either limit and the purchase is no longer refundable — the option simply disappears from My Orders. Nothing is ever locked: you keep full access to everything you paid for, we just stop being able to give the money back.`,
  },
  {
    q: "Can I get a refund on resources or seminars?",
    a: `No. ${NOT_REFUNDABLE_REASON.resource} ${NOT_REFUNDABLE_REASON.seminar} A resource is a file you keep the moment it downloads, and a seminar is a seat booked with a date and a seat-holder, so neither can be returned once sold. Neither ever appears as claimable in My Orders.`,
  },
  {
    q: "How do I request a refund?",
    a: "Open My Orders in your dashboard, find the purchase, and tap Request refund. The claim goes straight to our team with the order, your usage snapshot and the time of your request attached.",
  },
  {
    q: "How long do refunds take?",
    a: "Card refunds are issued as soon as you claim. Mobile wallet payouts are approved by our team, usually within one working day. Either way the money reaches your account within 7–15 business days, depending on your bank or payment provider.",
  },
  {
    q: "Can I get a refund after 3 days?",
    a: "The 3-day guarantee covers every course and bundle on its own. After that window we review requests case by case, so it is still worth writing to us — email support@flybridgeedu.com with your order number and we will tell you where you stand.",
  },
  {
    q: "What happens to my access?",
    a: "Nothing changes while you are deciding. The moment a refund is processed we close the order and release your access to that course or bundle, so the two never overlap.",
  },
];

/* ───────────────────────── small parts ───────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono text-[10.5px] font-medium uppercase mb-4"
      style={{ color: "var(--body)", letterSpacing: "0.22em" }}
    >
      {children}
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border bg-white ${className}`}
      style={{ borderColor: "var(--line)" }}
    >
      {children}
    </div>
  );
}

export default function RefundPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Header */}
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(130px,18vh,190px)] pb-[clamp(48px,6vw,72px)]">
          <div className="max-w-[880px] mx-auto">
            <div
              className="inline-flex items-center gap-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] px-4 py-2 mb-6"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
            >
              <ShieldCheck className="w-[13px] h-[13px]" strokeWidth={2.2} />
              REFUND POLICY
            </div>
            <h1
              className="font-display font-semibold tracking-[-0.025em] leading-[1.1] text-balance"
              style={{ fontSize: "clamp(34px,4.6vw,54px)", color: "var(--ink)" }}
            >
              3 days, 100% of your money back.
            </h1>
            <p
              className="mt-6 text-[16.5px] leading-[1.75] max-w-[640px]"
              style={{ color: "var(--body)" }}
            >
              Learning is a leap of faith, so we removed the risk from it. Every course and mock
              bundle you buy from FlyBridge can be refunded in full within 3 days of payment —
              claimed by you, from your own dashboard, without a single form or phone call.
            </p>

            <div
              className="flex flex-wrap gap-x-10 gap-y-4 mt-9 pt-7"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              {[
                { k: "Effective date", v: "September 2026" },
                { k: "Entity", v: "FlyBridge Education Group Inc." },
                { k: "Jurisdiction", v: "Ontario, Canada" },
                { k: "Applies to", v: "All paid courses and mock bundles" },
              ].map((m) => (
                <div key={m.k}>
                  <div
                    className="font-mono text-[10px] font-medium uppercase"
                    style={{ color: "var(--body)", letterSpacing: "0.16em" }}
                  >
                    {m.k}
                  </div>
                  <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The terms, at a glance */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[clamp(40px,5vw,64px)]">
          <div className="max-w-[880px] mx-auto">
            <div className="mb-7">
              <SectionLabel>The terms, at a glance</SectionLabel>
              <h2
                className="font-display font-semibold tracking-[-0.015em]"
                style={{ fontSize: "clamp(24px,3vw,32px)", color: "var(--ink)" }}
              >
                Everything the guarantee covers.
              </h2>
            </div>

            <Panel>
              <dl>
                {keyTerms.map((row, i) => (
                  <div
                    key={row.term}
                    className="grid gap-x-10 gap-y-1.5 px-6 md:px-8 py-5 sm:grid-cols-[210px_minmax(0,1fr)]"
                    style={
                      i > 0
                        ? { borderTop: "1px solid var(--line)" }
                        : undefined
                    }
                  >
                    <dt
                      className="text-[13px] font-semibold sm:pt-[2px]"
                      style={{ color: row.emphasis ? "var(--brand-2)" : "var(--ink)" }}
                    >
                      {row.term}
                    </dt>
                    <dd className="text-[14.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                      {row.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </section>

        {/* How to claim */}
        <section className="px-[clamp(20px,4.5vw,56px)] py-[clamp(40px,5vw,64px)]">
          <div className="max-w-[880px] mx-auto">
            <div className="mb-8">
              <SectionLabel>How to claim</SectionLabel>
              <h2
                className="font-display font-semibold tracking-[-0.015em]"
                style={{ fontSize: "clamp(24px,3vw,32px)", color: "var(--ink)" }}
              >
                Three steps, about a minute.
              </h2>
            </div>

            <div className="grid gap-4">
              {claimSteps.map((step) => (
                <Panel key={step.number} className="p-6 md:p-7">
                  <div className="flex gap-5 md:gap-7">
                    <span
                      className="font-mono text-[12.5px] font-semibold pt-[3px] shrink-0"
                      style={{ color: "var(--brand-2)" }}
                    >
                      {step.number}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className="font-display text-[18px] font-semibold leading-[1.35]"
                        style={{ color: "var(--ink)" }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="mt-2 text-[14.5px] leading-[1.75] max-w-[680px]"
                        style={{ color: "var(--body)" }}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </section>

        {/* The free usage allowance */}
        <section className="px-[clamp(20px,4.5vw,56px)] py-[clamp(40px,5vw,64px)]">
          <div className="max-w-[880px] mx-auto">
            <div className="mb-8">
              <SectionLabel>Your allowance</SectionLabel>
              <h2
                className="font-display font-semibold tracking-[-0.015em]"
                style={{ fontSize: "clamp(24px,3vw,32px)", color: "var(--ink)" }}
              >
                Try the course properly. We&apos;ll cover the first stretch.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Panel className="p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <FileText className="w-[18px] h-[18px] shrink-0" style={{ color: "var(--brand-2)" }} />
                  <div className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                    Lessons on us
                  </div>
                </div>
                <div className="mt-5 flex items-end gap-3">
                  <span
                    className="font-display text-[44px] font-semibold leading-none"
                    style={{ color: "var(--ink)" }}
                  >
                    {REFUND_LESSON_LIMIT}
                  </span>
                  <span className="text-[13.5px] pb-1" style={{ color: "var(--body)" }}>
                    lessons per course
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {Array.from({ length: REFUND_LESSON_LIMIT }, (_, i) => (
                    <span
                      key={i}
                      className="h-[6px] flex-1 rounded-full"
                      style={{ background: "var(--brand-2)" }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                  A lesson counts once, the first time you open it. One more lesson beyond these{" "}
                  {REFUND_LESSON_LIMIT} makes the course non-refundable.
                </p>
              </Panel>

              <Panel className="p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <FileText className="w-[18px] h-[18px] shrink-0" style={{ color: "var(--brand-2)" }} />
                  <div className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                    Mock exams on us
                  </div>
                </div>
                <div className="mt-5 flex items-end gap-3">
                  <span
                    className="font-display text-[44px] font-semibold leading-none"
                    style={{ color: "var(--ink)" }}
                  >
                    {REFUND_MOCK_LIMIT}
                  </span>
                  <span className="text-[13.5px] pb-1" style={{ color: "var(--body)" }}>
                    full-length mock per course
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-[6px] flex-1 rounded-full" style={{ background: "var(--brand-2)" }} />
                  <span className="h-[6px] flex-1 rounded-full" style={{ background: "var(--line)" }} />
                </div>
                <p className="mt-4 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                  A mock counts once, when you start a new sitting. Resuming the same mock is free.
                </p>
              </Panel>
            </div>

            <Panel className="mt-4 p-6 md:p-7">
              <div className="flex items-start gap-3.5">
                <Package
                  className="w-[18px] h-[18px] mt-[3px] shrink-0"
                  style={{ color: "var(--brand-2)" }}
                />
                <div>
                  <div className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                    Mock bundles work differently
                  </div>
                  <p
                    className="mt-1.5 text-[14px] leading-[1.75] max-w-[700px]"
                    style={{ color: "var(--body)" }}
                  >
                    A bundle is a collection of mocks rather than one piece of content, so there is
                    no sensible free sample of it. Open and browse as many of the mocks as you like —
                    the refund is only forfeited when you{" "}
                    <strong style={{ color: "var(--ink)" }}>submit the answers to a sitting</strong>
                    . A sitting you abandon without submitting costs you nothing. Once one has been
                    graded, that bundle is no longer refundable.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="mt-4 p-6 md:p-7">
              <div className="flex items-start gap-3.5">
                <CheckCircle2
                  className="w-[18px] h-[18px] mt-[3px] shrink-0"
                  style={{ color: "var(--brand-2)" }}
                />
                <div>
                  <div className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                    Nothing is ever locked
                  </div>
                  <p
                    className="mt-1.5 text-[14px] leading-[1.75] max-w-[700px]"
                    style={{ color: "var(--body)" }}
                  >
                    These counters only decide refund eligibility. You keep full access to every
                    lesson, mock and resource for as long as you are enrolled — crossing a limit
                    closes the refund option, nothing else.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </section>

        {/* Eligibility */}
        <section className="px-[clamp(20px,4.5vw,56px)] py-[clamp(40px,5vw,64px)]">
          <div className="max-w-[880px] mx-auto">
            <div className="mb-8">
              <SectionLabel>Eligibility</SectionLabel>
              <h2
                className="font-display font-semibold tracking-[-0.015em]"
                style={{ fontSize: "clamp(24px,3vw,32px)", color: "var(--ink)" }}
              >
                What is and isn&apos;t covered.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Panel className="p-6 md:p-7">
                <div className="flex items-center gap-2.5 mb-5">
                  <Check className="w-[15px] h-[15px]" strokeWidth={3} style={{ color: "var(--brand-2)" }} />
                  <span className="text-[13px] font-semibold uppercase" style={{ color: "var(--ink)", letterSpacing: "0.1em" }}>
                    Covered
                  </span>
                </div>
                <ul className="space-y-3.5">
                  {covered.map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span
                        className="mt-[7px] w-[5px] h-[5px] rounded-full shrink-0"
                        style={{ background: "var(--brand-2)" }}
                      />
                      <span className="text-[14px] leading-[1.65]" style={{ color: "var(--body)" }}>
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel className="p-6 md:p-7">
                <div className="flex items-center gap-2.5 mb-5">
                  <Minus className="w-[15px] h-[15px]" strokeWidth={3} style={{ color: "var(--body)" }} />
                  <span className="text-[13px] font-semibold uppercase" style={{ color: "var(--ink)", letterSpacing: "0.1em" }}>
                    Not covered
                  </span>
                </div>
                <ul className="space-y-3.5">
                  {notCovered.map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span
                        className="mt-[7px] w-[5px] h-[5px] rounded-full shrink-0"
                        style={{ background: "var(--line)" }}
                      />
                      <span className="text-[14px] leading-[1.65]" style={{ color: "var(--body)" }}>
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-[clamp(20px,4.5vw,56px)] py-[clamp(40px,5vw,64px)]">
          <div className="max-w-[880px] mx-auto">
            <div className="mb-8">
              <SectionLabel>
                <span className="inline-flex items-center gap-2">
                  <HelpCircle className="w-[12px] h-[12px]" strokeWidth={2.4} />
                  Questions
                </span>
              </SectionLabel>
              <h2
                className="font-display font-semibold tracking-[-0.015em]"
                style={{ fontSize: "clamp(24px,3vw,32px)", color: "var(--ink)" }}
              >
                The details people ask about.
              </h2>
            </div>

            <Panel>
              {faqs.map((f, i) => (
                <details
                  key={f.q}
                  className="refund-faq px-6 md:px-8 py-5"
                  style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
                >
                  <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
                    <span
                      className="font-display text-[15.5px] font-semibold leading-[1.45]"
                      style={{ color: "var(--ink)" }}
                    >
                      {f.q}
                    </span>
                    <span
                      className="refund-faq-icon w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                    >
                      <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </summary>
                  <p
                    className="mt-3.5 text-[14.5px] leading-[1.75] max-w-[720px]"
                    style={{ color: "var(--body)" }}
                  >
                    {f.a}
                  </p>
                </details>
              ))}
            </Panel>
          </div>
        </section>

        {/* Contact */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[clamp(64px,8vw,104px)] pt-[clamp(24px,3vw,40px)]">
          <div className="max-w-[880px] mx-auto">
            <div
              className="rounded-2xl p-[clamp(28px,4vw,44px)] relative overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                backgroundSize: "36px 36px, 36px 36px, auto",
              }}
            >
              <div
                className="absolute top-0 right-0 w-[280px] h-[280px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
              <div className="relative">
                <div
                  className="font-mono text-[11px] font-medium uppercase mb-3"
                  style={{ color: "rgba(255,255,255,0.75)", letterSpacing: "0.2em" }}
                >
                  Contact
                </div>
                <h2
                  className="font-display text-[clamp(24px,3vw,32px)] font-semibold text-white tracking-[-0.02em] max-w-[540px]"
                >
                  Something not covered here?
                </h2>
                <p
                  className="text-[14.5px] leading-[1.7] max-w-[520px] mt-3 mb-8"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  Send us your order number and we will tell you exactly where you stand — in plain
                  language, usually the same day.
                </p>
                <div className="grid sm:grid-cols-3 gap-3.5">
                  {[
                    {
                      icon: Mail,
                      label: "Email",
                      value: "support@flybridgeedu.com",
                      href: "mailto:support@flybridgeedu.com",
                    },
                    {
                      icon: Phone,
                      label: "Phone",
                      value: "+1 (778) 676-8459",
                      href: "tel:+17786768459",
                    },
                    {
                      icon: MapPin,
                      label: "Location",
                      value: "Toronto, Ontario, Canada",
                      href: "https://maps.google.com/?q=757+Gladstone+Avenue+Toronto",
                      external: true,
                    },
                  ].map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.external ? "_blank" : undefined}
                      rel={c.external ? "noopener noreferrer" : undefined}
                      className="group rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-[2px] transition-all duration-300 hover:bg-white/15"
                    >
                      <div
                        className="font-mono text-[9.5px] font-medium uppercase"
                        style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.2em" }}
                      >
                        {c.label}
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-[6px]">
                        <span className="text-[13.5px] font-medium leading-snug" style={{ color: "#fff" }}>
                          {c.value}
                        </span>
                        <c.icon
                          className="w-[14px] h-[14px] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                          strokeWidth={2}
                          style={{ color: "#fff" }}
                        />
                      </div>
                    </a>
                  ))}
                </div>
                <div className="mt-7 flex items-center gap-2.5">
                  <CreditCard className="w-[15px] h-[15px] shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} />
                  <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                    Refunds always return to the original payment method. We never issue credit
                    or store credit in place of cash.
                  </span>
                </div>
                <a
                  href="/dashboard/orders"
                  className="inline-flex items-center gap-2 mt-6 text-[13.5px] font-semibold"
                  style={{ color: "#fff" }}
                >
                  Go to My Orders
                  <ArrowRight className="w-[15px] h-[15px]" strokeWidth={2.2} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .refund-faq summary::-webkit-details-marker { display: none; }
        .refund-faq[open] .refund-faq-icon { transform: rotate(45deg); }
      `}</style>
    </>
  );
}
