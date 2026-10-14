import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { MousePointerClick, ShoppingBag, Wallet, Link2, Percent, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliate Program | FlyBridge Education Group",
  description:
    "Partner with FlyBridge. Share your links, refer learners, and earn a share of every sale — paid out on a simple, transparent schedule.",
};

const steps = [
  {
    icon: Link2,
    title: "Get your link",
    desc: "We set you up with a short link like flybridge.com/r/YOURNAME. Share it anywhere — social, blog, email, WhatsApp.",
  },
  {
    icon: MousePointerClick,
    title: "People click",
    desc: "Every visit through your link is tracked, so you can see exactly how much traffic you are driving.",
  },
  {
    icon: ShoppingBag,
    title: "They buy",
    desc: "When someone you referred completes a purchase, a commission is automatically recorded against your account.",
  },
  {
    icon: Wallet,
    title: "You get paid",
    desc: "Once the refund window passes, your earnings are approved and paid out manually to your bKash or bank account.",
  },
];

const perks = [
  {
    icon: Percent,
    title: "Generous commission",
    desc: "Earn a percentage of the net order value on courses, seminars and resources — no caps on what you can make.",
  },
  {
    icon: Clock,
    title: "Last-click, 90 days",
    desc: "If someone clicks your link and buys within 90 days, it counts. No complicated attribution to worry about.",
  },
  {
    icon: Wallet,
    title: "Transparent payouts",
    desc: "Track pending, approved and paid earnings in your own dashboard. Payments go out manually, with a reference for every transfer.",
  },
];

export default function AffiliatePage() {
  return (
    <>
      <Nav />
      <main>
        <section
          className="relative overflow-hidden px-[clamp(20px,4.5vw,56px)] pt-[150px] pb-[96px]"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 92% 4%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 2% 96%, rgba(107,76,224,0.07), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="mx-auto max-w-[1320px]">
            <div className="max-w-[820px]">
              <span
                className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "var(--brand-2)" }}
              >
                FlyBridge Affiliate Program
              </span>
              <h1
                className="mt-5 font-display font-medium leading-[1.08] tracking-[-0.02em] text-balance"
                style={{ fontSize: "clamp(34px,4.6vw,58px)", color: "var(--ink)" }}
              >
                Turn your audience into{" "}
                <span style={{ color: "var(--brand-2)" }}>real earnings.</span>
              </h1>
              <p className="mt-7 max-w-[620px] text-[16.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                If you teach, mentor, or simply know people who want to study or work abroad,
                become a FlyBridge affiliate. Share your personal link and earn a share of every
                sale it brings in — with clear tracking and honest, on-time payouts.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/partnership"
                  className="inline-flex items-center gap-2 rounded-full px-[26px] py-[13px] text-[14.5px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
                  style={{ background: "var(--brand)" }}
                >
                  Request access
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 rounded-full border px-[26px] py-[13px] text-[14.5px] font-semibold transition-colors"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  Questions? Contact us
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[80px]">
          <div className="mx-auto max-w-[1320px]">
            <h2
              className="font-display text-[clamp(24px,3vw,34px)] font-medium tracking-[-0.02em]"
              style={{ color: "var(--ink)" }}
            >
              How it works
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rounded-2xl border bg-white p-6"
                    style={{ borderColor: "var(--line)", boxShadow: "0 10px 24px -20px rgba(18,32,67,0.18)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--body)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[96px]">
          <div className="mx-auto max-w-[1320px]">
            <div
              className="rounded-[28px] border p-8 sm:p-12"
              style={{
                borderColor: "var(--line)",
                backgroundImage:
                  "radial-gradient(620px 380px at 88% 0%, rgba(15,169,104,0.08), transparent 60%), linear-gradient(180deg, #ffffff, var(--bg-soft))",
              }}
            >
              <h2
                className="font-display text-[clamp(22px,2.8vw,32px)] font-medium tracking-[-0.02em]"
                style={{ color: "var(--ink)" }}
              >
                Built to be simple and fair
              </h2>
              <div className="mt-9 grid gap-6 md:grid-cols-3">
                {perks.map((perk) => {
                  const Icon = perk.icon;
                  return (
                    <div key={perk.title}>
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                      >
                        <Icon size={18} />
                      </span>
                      <h3 className="mt-4 font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                        {perk.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                        {perk.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-11 flex flex-wrap items-center gap-4">
                <Link
                  href="/partnership"
                  className="inline-flex items-center gap-2 rounded-full px-[26px] py-[13px] text-[14.5px] font-semibold text-white transition-transform hover:-translate-y-[1px]"
                  style={{ background: "var(--brand)" }}
                >
                  Apply to join
                </Link>
                <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
                  Membership is by invitation. Tell us about your audience and we will be in touch.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
