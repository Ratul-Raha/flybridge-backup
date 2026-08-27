"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Nav } from "@/components/nav";
import {
  Search,
  GraduationCap,
  FolderDown,
  CreditCard,
  UserRound,
  ChevronDown,
  LifeBuoy,
  MessageCircle,
  Phone,
  Mail,
  Check,
  X,
} from "lucide-react";

type CategoryKey = "account" | "learning" | "resources" | "billing";

type Category = {
  key: CategoryKey;
  label: string;
  icon: ReactNode;
  desc: string;
  accent: string;
  soft: string;
};

const categories: Category[] = [
  {
    key: "account",
    label: "Account & Login",
    icon: <UserRound size={22} strokeWidth={1.9} />,
    desc: "Signing up, logging in, profile and sign out",
    accent: "#6B4CE0",
    soft: "rgba(107,76,224,0.12)",
  },
  {
    key: "learning",
    label: "Learning & Courses",
    icon: <GraduationCap size={22} strokeWidth={1.9} />,
    desc: "Courses, seminars, progress and certificates",
    accent: "#2F5FE0",
    soft: "rgba(47,95,224,0.12)",
  },
  {
    key: "resources",
    label: "Downloads & Resources",
    icon: <FolderDown size={22} strokeWidth={1.9} />,
    desc: "Free and members-only guides, templates and tools",
    accent: "#0FA968",
    soft: "rgba(15,169,104,0.12)",
  },
  {
    key: "billing",
    label: "Membership & Payments",
    icon: <CreditCard size={22} strokeWidth={1.9} />,
    desc: "Paid content, secure payments and refunds",
    accent: "#E08A17",
    soft: "rgba(224,138,23,0.12)",
  },
];

type Article = {
  id: string;
  category: CategoryKey;
  title: string;
  text: string;
};

const articles: Article[] = [
  {
    id: "create-account",
    category: "account",
    title: "How do I create an account?",
    text: "Creating an account is free and takes one click. From the Log in page, tap the Google button and choose the account you want to use. Your name and email are synced automatically — no forms to fill in.",
  },
  {
    id: "login",
    category: "account",
    title: "How do I log in to my dashboard?",
    text: "Visit the Log in page and sign in with Google using the same email you joined with. You'll land on your dashboard where you can see your courses, seminars, resources and notifications.",
  },
  {
    id: "forgot-login",
    category: "account",
    title: "I can't log in or lost access to my account",
    text: "FlyBridge uses Google sign-in, so account recovery goes through your Google account. First recover access to the Google account you originally used. If you're still stuck, contact support and we'll help you sort it out.",
  },
  {
    id: "profile-signout",
    category: "account",
    title: "How do I update my profile or sign out?",
    text: "Open Settings from your dashboard sidebar to update your details and profile photo. To sign out, use the Sign out button at the bottom of the sidebar.",
  },
  {
    id: "how-courses-work",
    category: "learning",
    title: "How do the online courses work?",
    text: "Each course is self-paced and video-based. Start a course from your dashboard, learn on your own schedule, track your progress, and earn a certificate when you finish.",
  },
  {
    id: "find-enroll-course",
    category: "learning",
    title: "How do I find and start a course?",
    text: "Go to Courses in your dashboard sidebar. Browser the All courses list, open one you like, and press Start. Your enrolled courses appear under My courses so you can jump back in anytime.",
  },
  {
    id: "seminars",
    category: "learning",
    title: "How do seminars work?",
    text: "Seminars are live or scheduled sessions you can register for. From the Seminars page, open a session and register. They show up under My seminars so you never miss one.",
  },
  {
    id: "certificates",
    category: "learning",
    title: "How do I get a certificate?",
    text: "Complete all the lessons and requirements in a course and a completion certificate is awarded to you, viewable from your dashboard.",
  },
  {
    id: "download-free",
    category: "resources",
    title: "How do I download free resources?",
    text: "Browse the public Resources page, open the resource you want, and press Download. Files are saved to your browser or device's download folder. Some resources open as a direct link instead.",
  },
  {
    id: "members-only",
    category: "resources",
    title: "Members-only resources said 'Log in to download' — what now?",
    text: "Members-only resources just need a free account. Tap the download button, sign in securely with Google, and the file will download automatically as soon as you're logged in.",
  },
  {
    id: "sop-generator",
    category: "resources",
    title: "What is the SOP Generator?",
    text: "The SOP Generator is a tool in your dashboard that helps you draft a strong Statement of Purpose for university applications. Answer a few prompts and it structures your draft for you.",
  },
  {
    id: "pricing",
    category: "billing",
    title: "What does members-only or paid content cost?",
    text: "Any price is shown on the resource or course itself. Many resources are free for everyone — a paid badge is always displayed clearly before you commit.",
  },
  {
    id: "payments",
    category: "billing",
    title: "How are payments processed?",
    text: "Payments are processed securely through trusted third-party gateways. We never store your credit card details directly on our servers.",
  },
  {
    id: "refunds",
    category: "billing",
    title: "Can I get a refund?",
    text: "Refund eligibility depends on the course or resource you purchased. If you believe you were charged in error, contact support within 14 days and we'll investigate and help.",
  },
];

const contacts = [
  {
    label: "Email us",
    value: "support@flybridgeedu.com",
    href: "mailto:support@flybridgeedu.com",
    icon: <Mail size={20} strokeWidth={1.9} />,
  },
  {
    label: "Call us",
    value: "+1 778 676 8459",
    href: "tel:+17786768459",
    icon: <Phone size={20} strokeWidth={1.9} />,
  },
  {
    label: "WhatsApp",
    value: "+1 (778) 676-8459",
    href: "https://wa.me/17786768459",
    icon: <MessageCircle size={20} strokeWidth={1.9} />,
    external: true,
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [openId, setOpenId] = useState<string | null>("create-account");
  const listRef = useRef<HTMLDivElement>(null);

  const catMeta = useMemo(() => {
    const map = new Map<CategoryKey, number>();
    for (const a of articles) map.set(a.category, (map.get(a.category) ?? 0) + 1);
    return map;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      const cat = categories.find((c) => c.key === a.category)?.label ?? "";
      return (
        a.title.toLowerCase().includes(q) ||
        a.text.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const hasQuery = query.trim().length > 0;

  const pickCategory = (key: CategoryKey) => {
    setCategory(key);
    setOpenId(null);
    setQuery("");
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <>
      <Nav />
      <main>
        {/* Hero + search */}
        <section
          className="pt-[150px] pb-[70px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 92% 4%, rgba(107,76,224,0.10), transparent 62%), radial-gradient(620px 400px at 5% 94%, rgba(15,169,104,0.08), transparent 60%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="max-w-[860px] mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] px-4 py-2 mb-7"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
            >
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
              HELP CENTER
            </div>

            <h1
              className="font-display font-semibold tracking-[-0.02em] leading-[1.08] text-balance"
              style={{ fontSize: "clamp(34px,5.4vw,58px)", color: "var(--ink)" }}
            >
              How can we <span style={{ color: "var(--brand-2)" }}>help you?</span>
            </h1>
            <p className="mt-5 text-[16.5px] leading-[1.7] max-w-[560px] mx-auto" style={{ color: "var(--body)" }}>
              Search for answers on accounts, courses, resources and payments — written in plain
              language, no support tickets required.
            </p>

            <div
              className="mt-9 flex items-center gap-3 rounded-full border bg-white pl-5 pr-2 py-2 max-w-[560px] mx-auto transition-all duration-300 focus-within:shadow-[0_18px_40px_-24px_rgba(107,76,224,0.45)] focus-within:border-brand-2/50"
              style={{ borderColor: "var(--line)", boxShadow: "0 14px 34px -26px rgba(18,32,67,0.25)" }}
            >
              <Search size={19} className="shrink-0" style={{ color: "var(--body)" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                className="w-full text-[15px] bg-transparent focus:outline-none"
                style={{ color: "var(--ink)" }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-soft)]"
                  style={{ color: "var(--body)" }}
                >
                  <X size={14} />
                </button>
              )}
              <span
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.2px] text-white"
                style={{ background: "var(--brand)" }}
              >
                Search
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12.5px]" style={{ color: "var(--body)" }}>
              <span>Popular:</span>
              {[
                { label: "Create an account", query: "create an account" },
                { label: "Log in", query: "log in" },
                { label: "Download resources", query: "download" },
                { label: "Refunds", query: "refund" },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setQuery(p.query)}
                  className="rounded-full border px-3.5 py-[6px] text-[12px] font-medium transition-all duration-200 hover:border-brand-2/50 hover:text-brand-2"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.8)", color: "var(--ink)" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Category cards */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-16">
          <div className="max-w-[980px] mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((c) => {
                const count = catMeta.get(c.key) ?? 0;
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => pickCategory(c.key)}
                    className="group text-left rounded-lg border bg-white p-6 transition-all duration-300 hover:-translate-y-1"
                    style={{
                      borderColor: active ? c.accent : "var(--line)",
                      boxShadow: active
                        ? `0 20px 44px -26px ${c.accent}`
                        : "0 6px 22px -16px rgba(18,32,67,0.14)",
                    }}
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: c.soft, color: c.accent }}
                    >
                      {c.icon}
                    </span>
                    <div className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                      {c.label}
                    </div>
                    <p className="text-[12.5px] leading-[1.55] mt-1" style={{ color: "var(--body)" }}>
                      {c.desc}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-[0.15em] uppercase" style={{ color: c.accent }}>
                      {count} {count === 1 ? "article" : "articles"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Articles */}
        <section ref={listRef} className="px-[clamp(20px,4.5vw,56px)] pb-[100px] scroll-mt-[100px]">
          <div className="max-w-[860px] mx-auto">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="font-mono text-[10.5px] font-medium tracking-[0.4em] uppercase" style={{ color: "var(--brand-2)" }}>
                  {hasQuery ? `Results · ${results.length}` : category === "all" ? "All articles" : categories.find((c) => c.key === category)?.label}
                </div>
                <h2 className="font-display font-semibold tracking-[-0.01em] mt-1" style={{ fontSize: "clamp(22px,2.6vw,30px)", color: "var(--ink)" }}>
                  {hasQuery ? "Search results" : "Browse help topics"}
                </h2>
              </div>
              {category !== "all" && (
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium transition-colors hover:border-brand-2/50"
                  style={{ borderColor: "var(--line)", color: "var(--body)" }}
                >
                  <X size={13} /> Clear filter
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div
                className="rounded-lg border bg-white text-center py-16 px-6"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                >
                  <Search size={24} />
                </span>
                <p className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
                  No articles found
                </p>
                <p className="text-[13.5px] mt-1.5" style={{ color: "var(--body)" }}>
                  Try a different keyword, or reach out — we&apos;re happy to help.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((a) => {
                  const cat = categories.find((c) => c.key === a.category)!;
                  const open = openId === a.id;
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border bg-white transition-all duration-300"
                      style={{
                        borderColor: open ? cat.accent : "var(--line)",
                        boxShadow: open ? `0 14px 34px -22px ${cat.accent}` : "0 4px 16px -14px rgba(18,32,67,0.12)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : a.id)}
                        aria-expanded={open}
                        className="w-full flex items-center gap-4 text-left px-5 sm:px-7 py-5"
                      >
                        <span
                          className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: cat.soft, color: cat.accent }}
                        >
                          {cat.icon}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[15px] font-medium leading-snug" style={{ color: "var(--ink)" }}>
                            {a.title}
                          </span>
                          <span className="block mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: cat.accent }}>
                            {cat.label}
                          </span>
                        </span>
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                          style={{
                            background: open ? cat.accent : "var(--bg-soft)",
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                            color: open ? "#fff" : "var(--body)",
                          }}
                        >
                          <ChevronDown size={15} />
                        </span>
                      </button>
                      {open && (
                        <div className="px-5 sm:px-7 pb-6 -mt-1">
                          <p className="text-[14px] leading-[1.75] max-w-[640px]" style={{ color: "var(--body)" }}>
                            {a.text}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[110px]">
          <div className="max-w-[980px] mx-auto">
            <div
              className="rounded-lg p-10 md:p-14 relative overflow-hidden"
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

              <div className="relative text-center">
                <span
                  className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                >
                  <LifeBuoy size={26} strokeWidth={1.8} />
                </span>
                <div className="font-mono text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Still stuck?
                </div>
                <h2 className="font-display text-[clamp(26px,3.2vw,38px)] font-semibold text-white tracking-[-0.02em] mt-2 text-balance">
                  We&apos;re here to help.
                </h2>
                <p className="text-[15.5px] leading-[1.65] max-w-[480px] mx-auto mt-3 mb-9" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Reach out through any channel below — a real person on our team will get back to you.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 max-w-[720px] mx-auto">
                  {contacts.map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.external ? "_blank" : undefined}
                      rel={c.external ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-[2px] text-left transition-all duration-300 hover:bg-white/15 hover:-translate-y-1"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
                        {c.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono text-[9.5px] font-medium uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {c.label}
                        </span>
                        <span className="block text-[13px] font-medium truncate mt-[3px]" style={{ color: "#fff" }}>
                          {c.value}
                        </span>
                      </span>
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
