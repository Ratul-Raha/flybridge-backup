import type { Metadata } from "next";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Refund Policy | FlyBridge Education Group",
  description:
    "Our straightforward refund policy: if you are not happy with a course within 3 days of purchase, you can claim a full 100% refund.",
};

const sections = [
  {
    number: "01",
    label: "Policy",
    title: "3-day full refund",
    paragraphs: [
      "We want you to be confident in your decision to learn with us. That is why every course purchase comes with a simple, no-questions-asked 3-day refund window.",
      "If, within 3 days of your purchase, you are not satisfied with the course for any reason, you can claim a refund and receive 100% of your money back.",
    ],
  },
  {
    number: "02",
    label: "How to claim",
    title: "Claiming a refund",
    paragraphs: [
      "To claim a refund, contact our support team within 3 days of your purchase. Let us know your order details and the reason you would like to cancel, and we will process it for you.",
      "Once your refund request is approved, the amount is returned to your original payment method.",
    ],
  },
  {
    number: "03",
    label: "Timeline",
    title: "Processing time",
    paragraphs: [
      "Refunds typically take 7–15 business days to appear back in your account, depending on your bank or payment provider.",
    ],
  },
  {
    number: "04",
    label: "Questions",
    title: "Need help?",
    paragraphs: [
      "If you have any questions about this policy or your refund, reach out to our support team and we will be happy to help.",
    ],
  },
];

const contactBlocks = [
  {
    label: "Email",
    value: "hello@flybridgeedu.com",
    href: "mailto:hello@flybridgeedu.com",
  },
  {
    label: "Phone",
    value: "+1 (778) 676-8459",
    href: "tel:+17786768459",
  },
  {
    label: "Location",
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
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(130px,18vh,190px)] pb-20">
          <div className="max-w-[820px] mx-auto">
            <div
              className="inline-flex items-center gap-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] px-4 py-2 mb-6"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
            >
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
              REFUND POLICY
            </div>
            <h1
              className="font-display font-semibold tracking-[-0.02em] leading-[1.08] text-balance"
              style={{ fontSize: "clamp(34px,5vw,56px)", color: "var(--ink)" }}
            >
              Simple, straightforward, <span style={{ color: "var(--brand-2)" }}>100% refund.</span>
            </h1>
            <p className="mt-6 text-[16.5px] leading-[1.7] max-w-[600px]" style={{ color: "var(--body)" }}>
              Not loving a course? Within 3 days of your purchase you can claim a
              full refund — no questions asked.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-9">
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3px]" style={{ color: "var(--body)" }}>
                  Window
                </div>
                <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>3 days</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3px]" style={{ color: "var(--body)" }}>
                  Amount refunded
                </div>
                <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>100%</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3px]" style={{ color: "var(--body)" }}>
                  Processing
                </div>
                <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>7–15 business days</div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[110px]">
          <div className="max-w-[820px] mx-auto space-y-8">
            {sections.map((s) => (
              <div key={s.number} className="rounded-lg border bg-white p-7 md:p-9" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-[12px] font-semibold" style={{ color: "var(--brand-2)" }}>
                    {s.number}
                  </span>
                  <h2 className="font-display text-[20px] md:text-[23px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                    {s.title}
                  </h2>
                </div>
                <div className="space-y-3">
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="text-[14.5px] leading-[1.75]" style={{ color: "var(--body)" }}>
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            <div
              className="rounded-lg p-8 md:p-10 relative overflow-hidden"
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
                <div className="font-mono text-[11.5px] font-medium tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>
                  05 — Contact us
                </div>
                <h2 className="font-display text-[clamp(24px,3vw,32px)] font-semibold text-white tracking-[-0.02em] max-w-[540px]">
                  Ready to claim a refund?
                </h2>
                <p className="text-[15px] leading-[1.65] max-w-[480px] mt-3 mb-8" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Get in touch within 3 days of purchase and we&apos;ll take care of the rest.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {contactBlocks.map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.external ? "_blank" : undefined}
                      rel={c.external ? "noopener noreferrer" : undefined}
                      className="rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-[2px] transition-all duration-300 hover:bg-white/15 hover:-translate-y-1"
                    >
                      <div className="font-mono text-[9.5px] font-medium tracking-[0.3em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {c.label}
                      </div>
                      <div className="text-[13.5px] font-medium mt-[4px]" style={{ color: "#fff" }}>{c.value}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}