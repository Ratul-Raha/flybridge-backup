import type { Metadata } from "next";
import Link from "next/link";
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
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Refund Policy | FlyBridge Education Group",
  description:
    "A 3-day, 100% money-back guarantee on every FlyBridge course and mock bundle. Read the full policy: the refund window, your free lesson and mock exam allowance, why resources and seminars are non-refundable, how to claim, and how quickly you are paid.",
};

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
    detail:
      "Every paid course and every paid mock bundle on FlyBridge, whatever the payment method. Resources and seminars are not covered.",
  },
  {
    term: "Your free usage on a course",
    detail: `The first ${REFUND_LESSON_LIMIT} lessons and the first ${REFUND_MOCK_LIMIT} mock exam are on us, on every course.`,
  },
  {
    term: "Your free usage on a bundle",
    detail:
      "Browse any mock in the bundle freely. The moment you submit a sitting, the refund for that bundle is gone.",
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
    desc: "Tap Request refund, pick a reason, and confirm. If none of the reasons fit what happened, write it in your own words instead — that box is the reason, and a sentence is plenty. We ask because a spike in any one of them tells us what to fix, and nothing you tell us affects your eligibility. The window, the usage counters and the order status are all re-checked on our servers at that moment, so the decision never rests on the button being on screen.",
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
  "A reason we can act on, in one tap or a sentence of your own",
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

const highlights = [
  { icon: ShieldCheck, value: "100%", label: "of your money back" },
  { icon: Clock3, value: "3 days", label: "to decide, from payment" },
  { icon: BadgeCheck, value: "No fees", label: "deducted, ever" },
  { icon: CreditCard, value: "7–15 days", label: "to reach your account" },
];

const pageSections = [
  { id: "terms", number: "01", label: "Key terms" },
  { id: "how-to-claim", number: "02", label: "How to claim" },
  { id: "allowance", number: "03", label: "Your allowance" },
  { id: "eligibility", number: "04", label: "Eligibility" },
  { id: "faq", number: "05", label: "Questions" },
  { id: "contact", number: "06", label: "Contact" },
];

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

function SectionHeading({
  number,
  label,
  title,
}: {
  number: string;
  label: string;
  title: string;
}) {
  return (
    <div className="mb-7 flex items-start gap-4">
      <span
        className="mt-[3px] font-mono text-[12px] font-semibold shrink-0"
        style={{ color: "var(--brand-2)" }}
      >
        {number}
      </span>
      <div className="min-w-0">
        <SectionLabel>{label}</SectionLabel>
        <h2
          className="font-display font-semibold tracking-[-0.015em]"
          style={{ fontSize: "clamp(24px,3vw,32px)", color: "var(--ink)" }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

export default function RefundPage() {
  return (
    <>
      <Nav />
      <main>
        <section
          id="guarantee"
          className="relative overflow-hidden px-[clamp(20px,4.5vw,56px)] pt-[clamp(130px,18vh,190px)] pb-[clamp(48px,6vw,72px)] scroll-mt-[92px]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 88% 8%, rgba(15,169,104,0.14), transparent 45%), linear-gradient(rgba(18,32,67,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.035) 1px, transparent 1px)",
            backgroundSize: "auto, 38px 38px, 38px 38px",
          }}
        >
          <div className="relative mx-auto max-w-[1180px]">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_390px]">
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] px-4 py-2 mb-7"
                  style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                >
                  <ShieldCheck className="w-[13px] h-[13px]" strokeWidth={2.2} />
                  OUR REFUND PROMISE
                </div>
                <h1
                  className="font-display font-semibold tracking-[-0.025em] leading-[1.08] text-balance"
                  style={{ fontSize: "clamp(38px,5.2vw,62px)", color: "var(--ink)" }}
                >
                  Enrol with confidence.{" "}
                  <span style={{ color: "var(--brand-2)" }}>Get every taka back</span> if it is not
                  right for you.
                </h1>
                <p
                  className="mt-6 text-[16.5px] leading-[1.75] max-w-[620px]"
                  style={{ color: "var(--body)" }}
                >
                  Learning is a leap of faith, so we removed the risk from it. Every course and mock
                  bundle you buy from FlyBridge can be refunded in full within 3 days of payment —
                  claimed by you, from your own dashboard, without a single form or phone call.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/programs"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                    style={{ background: "var(--ink)" }}
                  >
                    Explore courses
                    <ArrowRight className="w-[15px] h-[15px]" strokeWidth={2.2} />
                  </Link>
                  <a
                    href="#how-to-claim"
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[13.5px] font-semibold transition-colors duration-200 hover:bg-white"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    See how it works
                  </a>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {["Self-serve claim", "No forms or calls", "No fee deducted"].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium"
                      style={{ color: "var(--body)" }}
                    >
                      <Check
                        className="w-[13px] h-[13px]"
                        strokeWidth={3}
                        style={{ color: "var(--brand-2)" }}
                      />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-[32px] blur-2xl"
                  style={{ background: "rgba(15,169,104,0.1)" }}
                />
                <div
                  className="relative rounded-[24px] border bg-white p-7 shadow-[0_24px_70px_-30px_rgba(18,32,67,0.35)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="font-mono text-[10px] font-medium uppercase"
                      style={{ color: "var(--body)", letterSpacing: "0.18em" }}
                    >
                      The FlyBridge promise
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                    >
                      Seal of trust
                    </span>
                  </div>
                  <div className="mt-7 flex items-center gap-4">
                    <div
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                    >
                      <ShieldCheck className="h-[26px] w-[26px]" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div
                        className="font-display text-[46px] font-semibold leading-none"
                        style={{ color: "var(--ink)" }}
                      >
                        100%
                      </div>
                      <div className="text-[13px]" style={{ color: "var(--body)" }}>
                        of what you paid, back in your account
                      </div>
                    </div>
                  </div>
                  <div className="mt-7 border-t pt-1" style={{ borderColor: "var(--line)" }}>
                    {[
                      { label: "Decision window", value: `${REFUND_WINDOW_DAYS} full days` },
                      { label: "How to claim", value: "My Orders, self-serve" },
                      { label: "Deductions", value: "None, ever" },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-4 border-b py-3 text-[13px] last:border-b-0"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <span style={{ color: "var(--body)" }}>{row.label}</span>
                        <span className="font-medium" style={{ color: "var(--ink)" }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-5 flex items-start gap-2.5 rounded-lg p-3.5"
                    style={{ background: "var(--bg-soft)" }}
                  >
                    <CheckCircle2
                      className="mt-[1px] h-[15px] w-[15px] shrink-0"
                      strokeWidth={2.2}
                      style={{ color: "var(--brand-2)" }}
                    />
                    <span className="text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                      Applies to every paid course and mock bundle on FlyBridge.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-12 grid grid-cols-2 gap-3 border-t pt-8 lg:grid-cols-4"
              style={{ borderColor: "var(--line)" }}
            >
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border bg-white/80 p-4 backdrop-blur-sm"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <Icon
                      className="h-[17px] w-[17px]"
                      strokeWidth={1.9}
                      style={{ color: "var(--brand-2)" }}
                    />
                    <div
                      className="mt-3 font-display text-[22px] font-semibold leading-none"
                      style={{ color: "var(--ink)" }}
                    >
                      {item.value}
                    </div>
                    <div className="mt-1.5 text-[12px]" style={{ color: "var(--body)" }}>
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="px-[clamp(20px,4.5vw,56px)] pb-[clamp(64px,8vw,104px)]">
          <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-[110px]">
                <div
                  className="font-mono text-[10.5px] font-medium uppercase"
                  style={{ color: "var(--body)", letterSpacing: "0.22em" }}
                >
                  On this page
                </div>
                <nav className="mt-4 space-y-1">
                  {pageSections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-[var(--bg-soft)]"
                    >
                      <span
                        className="font-mono text-[10px] font-semibold"
                        style={{ color: "var(--brand-2)" }}
                      >
                        {section.number}
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                        {section.label}
                      </span>
                    </a>
                  ))}
                </nav>
                <div
                  className="mt-7 rounded-xl border p-4"
                  style={{ background: "var(--brand-soft)", borderColor: "rgba(15,169,104,0.22)" }}
                >
                  <Sparkles className="h-[17px] w-[17px]" style={{ color: "var(--brand-2)" }} />
                  <p className="mt-3 text-[12.5px] leading-[1.65]" style={{ color: "var(--ink)" }}>
                    Your refund button lives in My Orders. No email thread needed.
                  </p>
                  <Link
                    href="/dashboard/orders"
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: "var(--brand-2)" }}
                  >
                    Open My Orders
                    <ArrowRight className="h-[13px] w-[13px]" strokeWidth={2.2} />
                  </Link>
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {pageSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-medium"
                    style={{ borderColor: "var(--line)", color: "var(--ink)", background: "#fff" }}
                  >
                    {section.label}
                  </a>
                ))}
              </div>

              <section id="terms" className="scroll-mt-[92px] pb-[clamp(40px,5vw,64px)]">
                <SectionHeading
                  number="01"
                  label="The key terms"
                  title="Everything the guarantee covers."
                />
                <Panel>
                  <dl>
                    {keyTerms.map((row, i) => (
                      <div
                        key={row.term}
                        className="grid gap-x-10 gap-y-1.5 px-6 py-5 transition-colors duration-200 hover:bg-[var(--bg-soft)] md:px-8 sm:grid-cols-[210px_minmax(0,1fr)]"
                        style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
                      >
                        <dt
                          className="text-[13px] font-semibold sm:pt-[2px]"
                          style={{ color: row.emphasis ? "var(--brand-2)" : "var(--ink)" }}
                        >
                          {row.term}
                        </dt>
                        <dd
                          className="text-[14.5px] leading-[1.7]"
                          style={{ color: "var(--body)" }}
                        >
                          {row.detail}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              </section>

              <section id="how-to-claim" className="scroll-mt-[92px] pb-[clamp(40px,5vw,64px)]">
                <SectionHeading
                  number="02"
                  label="How to claim"
                  title="Three steps, about a minute."
                />
                <div className="relative">
                  <div
                    className="absolute bottom-8 left-[39px] top-8 w-px"
                    style={{ background: "var(--line)" }}
                  />
                  <div className="relative space-y-4">
                    {claimSteps.map((step) => (
                      <Panel
                        key={step.number}
                        className="relative p-6 pl-[68px] md:p-7 md:pl-[68px]"
                      >
                        <span
                          className="absolute left-5 top-6 flex h-[39px] w-[39px] items-center justify-center rounded-full border bg-white font-mono text-[11px] font-semibold"
                          style={{ borderColor: "var(--line)", color: "var(--brand-2)" }}
                        >
                          {step.number}
                        </span>
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
                      </Panel>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/dashboard/orders"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                    style={{ color: "var(--brand-2)" }}
                  >
                    Go to My Orders
                    <ArrowRight className="h-[14px] w-[14px]" strokeWidth={2.2} />
                  </Link>
                  <span className="text-[12.5px]" style={{ color: "var(--body)" }}>
                    — your countdown and remaining allowance are shown there.
                  </span>
                </div>
              </section>

              <section id="allowance" className="scroll-mt-[92px] pb-[clamp(40px,5vw,64px)]">
                <SectionHeading
                  number="03"
                  label="Your allowance"
                  title="Try the course properly. We'll cover the first stretch."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel className="p-6 md:p-7">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-lg"
                        style={{ background: "var(--brand-soft)" }}
                      >
                        <FileText
                          className="h-[17px] w-[17px]"
                          style={{ color: "var(--brand-2)" }}
                        />
                      </div>
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
                      <span className="pb-1 text-[13.5px]" style={{ color: "var(--body)" }}>
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
                    <p
                      className="mt-4 text-[13.5px] leading-[1.7]"
                      style={{ color: "var(--body)" }}
                    >
                      A lesson counts once, the first time you open it. One more lesson beyond these{" "}
                      {REFUND_LESSON_LIMIT} makes the course non-refundable.
                    </p>
                  </Panel>

                  <Panel className="p-6 md:p-7">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-lg"
                        style={{ background: "var(--brand-soft)" }}
                      >
                        <FileText
                          className="h-[17px] w-[17px]"
                          style={{ color: "var(--brand-2)" }}
                        />
                      </div>
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
                      <span className="pb-1 text-[13.5px]" style={{ color: "var(--body)" }}>
                        full-length mock per course
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className="h-[6px] flex-1 rounded-full"
                        style={{ background: "var(--brand-2)" }}
                      />
                      <span
                        className="h-[6px] flex-1 rounded-full"
                        style={{ background: "var(--line)" }}
                      />
                    </div>
                    <p
                      className="mt-4 text-[13.5px] leading-[1.7]"
                      style={{ color: "var(--body)" }}
                    >
                      A mock counts once, when you start a new sitting. Resuming the same mock is
                      free.
                    </p>
                  </Panel>
                </div>

                <Panel className="mt-4 p-6 md:p-7">
                  <div className="flex items-start gap-3.5">
                    <Package
                      className="mt-[3px] h-[18px] w-[18px] shrink-0"
                      style={{ color: "var(--brand-2)" }}
                    />
                    <div>
                      <div className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                        Mock bundles work differently
                      </div>
                      <p
                        className="mt-1.5 max-w-[700px] text-[14px] leading-[1.75]"
                        style={{ color: "var(--body)" }}
                      >
                        A bundle is a collection of mocks rather than one piece of content, so there
                        is no sensible free sample of it. Open and browse as many of the mocks as
                        you like — the refund is only forfeited when you{" "}
                        <strong style={{ color: "var(--ink)" }}>
                          submit the answers to a sitting
                        </strong>
                        . A sitting you abandon without submitting costs you nothing. Once one has
                        been graded, that bundle is no longer refundable.
                      </p>
                    </div>
                  </div>
                </Panel>

                <Panel className="mt-4 p-6 md:p-7">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2
                      className="mt-[3px] h-[18px] w-[18px] shrink-0"
                      style={{ color: "var(--brand-2)" }}
                    />
                    <div>
                      <div className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                        Nothing is ever locked
                      </div>
                      <p
                        className="mt-1.5 max-w-[700px] text-[14px] leading-[1.75]"
                        style={{ color: "var(--body)" }}
                      >
                        These counters only decide refund eligibility. You keep full access to every
                        lesson, mock and resource for as long as you are enrolled — crossing a limit
                        closes the refund option, nothing else.
                      </p>
                    </div>
                  </div>
                </Panel>
              </section>

              <section id="eligibility" className="scroll-mt-[92px] pb-[clamp(40px,5vw,64px)]">
                <SectionHeading
                  number="04"
                  label="Eligibility"
                  title="What is and isn't covered."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel className="p-6 md:p-7">
                    <div className="mb-5 flex items-center gap-2.5">
                      <span
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full"
                        style={{ background: "var(--brand-soft)" }}
                      >
                        <Check
                          className="h-[14px] w-[14px]"
                          strokeWidth={3}
                          style={{ color: "var(--brand-2)" }}
                        />
                      </span>
                      <span
                        className="text-[13px] font-semibold uppercase"
                        style={{ color: "var(--ink)", letterSpacing: "0.1em" }}
                      >
                        Covered
                      </span>
                    </div>
                    <ul className="space-y-3.5">
                      {covered.map((t) => (
                        <li key={t} className="flex items-start gap-3">
                          <span
                            className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full"
                            style={{ background: "var(--brand-2)" }}
                          />
                          <span
                            className="text-[14px] leading-[1.65]"
                            style={{ color: "var(--body)" }}
                          >
                            {t}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>

                  <Panel className="p-6 md:p-7">
                    <div className="mb-5 flex items-center gap-2.5">
                      <span
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full"
                        style={{ background: "var(--bg-soft)" }}
                      >
                        <Minus
                          className="h-[14px] w-[14px]"
                          strokeWidth={3}
                          style={{ color: "var(--body)" }}
                        />
                      </span>
                      <span
                        className="text-[13px] font-semibold uppercase"
                        style={{ color: "var(--ink)", letterSpacing: "0.1em" }}
                      >
                        Not covered
                      </span>
                    </div>
                    <ul className="space-y-3.5">
                      {notCovered.map((t) => (
                        <li key={t} className="flex items-start gap-3">
                          <span
                            className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full"
                            style={{ background: "var(--line)" }}
                          />
                          <span
                            className="text-[14px] leading-[1.65]"
                            style={{ color: "var(--body)" }}
                          >
                            {t}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>
              </section>

              <section id="faq" className="scroll-mt-[92px] pb-[clamp(40px,5vw,64px)]">
                <SectionHeading
                  number="05"
                  label="Questions"
                  title="The details people ask about."
                />
                <Panel>
                  {faqs.map((f, i) => (
                    <details
                      key={f.q}
                      className="refund-faq px-6 py-5 md:px-8"
                      style={i > 0 ? { borderTop: "1px solid var(--line)" } : undefined}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                        <span
                          className="font-display text-[15.5px] font-semibold leading-[1.45]"
                          style={{ color: "var(--ink)" }}
                        >
                          {f.q}
                        </span>
                        <span
                          className="refund-faq-icon flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full transition-all duration-200"
                          style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
                        >
                          <svg className="h-[12px] w-[12px]" viewBox="0 0 24 24" fill="none">
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
                        className="mt-3.5 max-w-[720px] text-[14.5px] leading-[1.75]"
                        style={{ color: "var(--body)" }}
                      >
                        {f.a}
                      </p>
                    </details>
                  ))}
                </Panel>
              </section>

              <section id="contact" className="scroll-mt-[92px]">
                <div
                  className="relative overflow-hidden rounded-2xl p-[clamp(28px,4vw,44px)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                    backgroundSize: "36px 36px, 36px 36px, auto",
                  }}
                >
                  <div
                    className="absolute -translate-y-1/2 translate-x-1/2 right-0 top-0 h-[280px] w-[280px] rounded-full blur-[100px]"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  />
                  <div className="relative">
                    <div
                      className="mb-3 font-mono text-[11px] font-medium uppercase"
                      style={{ color: "rgba(255,255,255,0.75)", letterSpacing: "0.2em" }}
                    >
                      Contact
                    </div>
                    <h2 className="font-display max-w-[540px] text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-white">
                      Something not covered here?
                    </h2>
                    <p
                      className="mb-7 mt-3 max-w-[520px] text-[14.5px] leading-[1.7]"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      Send us your order number and we will tell you exactly where you stand — in
                      plain language, usually the same day.
                    </p>
                    <div className="grid gap-3.5 sm:grid-cols-3">
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
                          <div className="mt-[6px] flex items-center justify-between gap-3">
                            <span className="text-[13.5px] font-medium leading-snug text-white">
                              {c.value}
                            </span>
                            <c.icon
                              className="h-[14px] w-[14px] shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
                              strokeWidth={2}
                              style={{ color: "#fff" }}
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                    <div className="mt-7 flex items-center gap-2.5">
                      <CreditCard
                        className="h-[15px] w-[15px] shrink-0"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      />
                      <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                        Refunds always return to the original payment method. We never issue credit
                        or store credit in place of cash.
                      </span>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <Link
                        href="/programs"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0B5E46] transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        Browse courses
                        <ArrowRight className="h-[14px] w-[14px]" strokeWidth={2.2} />
                      </Link>
                      <Link
                        href="/dashboard/orders"
                        className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white"
                      >
                        Go to My Orders
                        <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.2} />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .refund-faq summary::-webkit-details-marker { display: none; }
        .refund-faq[open] .refund-faq-icon { transform: rotate(45deg); }
      `}</style>
    </>
  );
}
