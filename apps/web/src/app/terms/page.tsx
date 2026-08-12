import type { Metadata } from "next";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Terms of Service | FlyBridge Education Group",
  description:
    "The terms and conditions that govern your use of the FlyBridge Education Group learning platform — accounts, content access, payments, and more.",
};

const sections = [
  {
    number: "01",
    label: "Agreement",
    title: "Acceptance of terms",
    paragraphs: [
      "By creating an account or using the FlyBridge Education Group platform, website, and any related services (together, the \"Services\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree, please do not use the Services.",
      "These Terms form a binding agreement between you and FlyBridge Education Group Inc. (\"we\", \"us\", or \"our\"). We may update these Terms from time to time, and continued use of the Services after changes are posted means you accept the revised Terms.",
    ],
  },
  {
    number: "02",
    label: "Accounts",
    title: "Accounts & eligibility",
    paragraphs: [
      "You must be at least 13 years old to use the Services. To access members-only content, you must create an account using accurate and complete information and keep it secure. You are responsible for all activity that happens under your account.",
      "We may suspend or close accounts that violate these Terms, that are used for unlawful activity, or that we determine in good faith to harm the platform or other users.",
    ],
  },
  {
    number: "03",
    label: "Content",
    title: "Courses, resources & access",
    paragraphs: [
      "Free resources are available to everyone. Members-only courses, documents, templates, and tools are available to signed-in users who meet the applicable access requirements.",
      "A license to access and use our content for your personal, non-commercial learning is granted when these Terms are met. You may not resell, redistribute, or publicly republish our content without written permission.",
      "Downloaded files are provided \"as is\" for your own study. Sharing or re-hosting them publicly is a violation of these Terms.",
    ],
  },
  {
    number: "04",
    label: "Payments",
    title: "Payments & refunds",
    paragraphs: [
      "Where paid content or services are offered, prices are displayed at the time of purchase. We may update prices for future purchases, with existing entitlements honoured as described at purchase.",
      "Unless otherwise stated at checkout, purchases are non-refundable once access has been granted. If you believe you were charged in error, contact us within 14 days and we will investigate and, where appropriate, issue a refund.",
    ],
  },
  {
    number: "05",
    label: "Conduct",
    title: "Your conduct",
    paragraphs: [
      "You agree not to misuse the Services: no unauthorised access to other users' accounts, no attempts to break or bypass security, no scraping or automated harvesting of content, and no publishing of offensive, unlawful, or misleading material.",
      "You also agree not to impersonate others, to interfere with the availability of the Services, or to use the Services in any way that violates applicable law.",
    ],
  },
  {
    number: "06",
    label: "IP",
    title: "Intellectual property",
    paragraphs: [
      "All content, course materials, branding, logos, and software on the platform remain the property of FlyBridge Education Group Inc., its licensors, or the respective instructors, and are protected by intellectual property laws.",
      "Nothing in these Terms grants you any rights beyond the personal licence described above.",
    ],
  },
  {
    number: "07",
    label: "Liability",
    title: "Disclaimer & liability",
    paragraphs: [
      "The Services and all content are provided \"as is\" and \"as available\" without warranties of any kind, express or implied. We do not guarantee specific learning outcomes, exam results, or immigration or employment results.",
      "To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the Services. Your reliance on any educational guidance is at your own discretion.",
    ],
  },
  {
    number: "08",
    label: "Termination",
    title: "Termination",
    paragraphs: [
      "You may stop using the Services at any time and may request account deletion through your profile settings. We may terminate or suspend access where these Terms are breached or where continued operation would be unlawful.",
      "Sections that by their nature should survive termination — including payments, intellectual property, and liability — will continue to apply.",
    ],
  },
  {
    number: "09",
    label: "Law",
    title: "Governing law",
    paragraphs: [
      "These Terms are governed by the laws of the Province of Ontario, Canada. Any disputes will be resolved in the courts of Ontario.",
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

export default function TermsPage() {
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
              TERMS OF SERVICE
            </div>
            <h1
              className="font-display font-semibold tracking-[-0.02em] leading-[1.08] text-balance"
              style={{ fontSize: "clamp(34px,5vw,56px)", color: "var(--ink)" }}
            >
              The rules that keep FlyBridge fair for <span style={{ color: "var(--brand-2)" }}>everyone.</span>
            </h1>
            <p className="mt-6 text-[16.5px] leading-[1.7] max-w-[600px]" style={{ color: "var(--body)" }}>
              A plain-language summary of the terms that govern your use of our platform, your
              access to content, and your responsibilities as a member.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-9">
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3px]" style={{ color: "var(--body)" }}>
                  Effective date
                </div>
                <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>August 2026</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3px]" style={{ color: "var(--body)" }}>
                  Entity
                </div>
                <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>FlyBridge Education Group Inc.</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.3px]" style={{ color: "var(--body)" }}>
                  Jurisdiction
                </div>
                <div className="text-[14px] font-medium mt-[3px]" style={{ color: "var(--ink)" }}>Ontario, Canada</div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[110px]">
          <div className="max-w-[820px] mx-auto space-y-8">
            {sections.map((s) => (
              <div key={s.number} className="rounded-3xl border bg-white p-7 md:p-9" style={{ borderColor: "var(--line)" }}>
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
              className="rounded-[28px] p-8 md:p-10 relative overflow-hidden"
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
                  10 — Contact us
                </div>
                <h2 className="font-display text-[clamp(24px,3vw,32px)] font-semibold text-white tracking-[-0.02em] max-w-[540px]">
                  Questions about these terms?
                </h2>
                <p className="text-[15px] leading-[1.65] max-w-[480px] mt-3 mb-8" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Reach out — we&apos;re happy to explain anything in plain language.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {contactBlocks.map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.external ? "_blank" : undefined}
                      rel={c.external ? "noopener noreferrer" : undefined}
                      className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-[2px] transition-all duration-300 hover:bg-white/15 hover:-translate-y-1"
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
