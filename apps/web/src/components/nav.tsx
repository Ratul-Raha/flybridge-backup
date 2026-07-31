"use client";

import { useState, useEffect } from "react";

const links = [
  { label: "Programs", href: "#programs" },
  { label: "Study Abroad", href: "#", hasCaret: true },
  { label: "Work Abroad", href: "#", hasCaret: true },
  { label: "English", href: "#" },
  { label: "Resources", href: "#" },
  { label: "Success Stories", href: "#" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`navbar fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-shadow duration-300 px-[clamp(20px,4.5vw,56px)] ${
          scrolled
            ? "shadow-[0_6px_24px_-12px_rgba(18,32,67,0.12)] border-b border-line"
            : "shadow-none border-b border-transparent"
        }`}
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}
      >
        <a href="#" className="brand flex items-center gap-[10px]">
          <svg className="w-[38px] h-[38px] shrink-0" viewBox="0 0 40 40" fill="none">
            <path d="M20 4L34 30H23L20 24L17 30H6L20 4Z" fill="url(#gradMark)" />
            <defs>
              <linearGradient id="gradMark" x1="6" y1="4" x2="34" y2="30">
                <stop offset="0%" stopColor="#2F5FE0" />
                <stop offset="100%" stopColor="#1D2E6B" />
              </linearGradient>
            </defs>
          </svg>
          <span className="flex flex-col leading-[1.05]">
            <span className="font-extrabold text-[16.5px] tracking-[0.2px]" style={{ color: "var(--brand)" }}>
              FlyBridge
            </span>
            <span className="font-mono text-[9px] tracking-[1.6px] mt-[2px]" style={{ color: "var(--body)" }}>
              EDUCATION GROUP
            </span>
          </span>
        </a>

        <ul className="hidden lg:flex items-center gap-[30px]">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="flex items-center gap-[4px] text-[14px] font-medium py-[6px] px-[2px] relative
                  after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-brand-2 after:rounded-[2px] after:transition-all after:duration-250
                  hover:after:w-full"
                style={{ color: "var(--ink)" }}
              >
                {link.label}
                {link.hasCaret && (
                  <svg className="w-[9px] h-[9px]" style={{ opacity: 0.55 }} viewBox="0 0 24 24" fill="none">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-[14px]">
          <button
            className="w-[38px] h-[38px] rounded-full border border-line flex items-center justify-center bg-white hover:border-brand-2 hover:bg-brand-soft transition-all duration-250"
            aria-label="Search"
          >
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21L16.65 16.65" strokeLinecap="round" />
            </svg>
          </button>

          <a
            href="#"
            className="hidden sm:inline-flex text-[14px] font-semibold border border-line rounded-full px-5 py-[9px] hover:border-brand-2 hover:text-brand-2 transition-all duration-250"
            style={{ color: "var(--ink)" }}
          >
            Log in
          </a>

          <a
            href="#"
            className="btn-solid-pill hidden sm:inline-flex items-center gap-2 text-[14px] font-semibold text-white rounded-full px-[22px] py-[10px] hover:translate-y-[-1px] transition-all duration-250"
            style={{ background: "var(--brand)" }}
          >
            Get started
            <svg className="w-[14px] h-[14px] group-hover:translate-x-[3px] transition-transform duration-250" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          <button
            className="lg:hidden w-[22px] h-[16px] relative bg-none border-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`absolute left-0 w-full h-[2px] rounded-[2px] transition-all duration-300 ${mobileOpen ? 'top-[7px] rotate-45' : 'top-0'}`} style={{ background: "var(--ink)" }} />
            <span className={`absolute left-0 w-full h-[2px] rounded-[2px] top-[7px] transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} style={{ background: "var(--ink)" }} />
            <span className={`absolute left-0 w-full h-[2px] rounded-[2px] transition-all duration-300 ${mobileOpen ? 'top-[7px] -rotate-45' : 'top-[14px]'}`} style={{ background: "var(--ink)" }} />
          </button>
        </div>
      </nav>

      <div
        className={`fixed top-0 right-0 h-screen z-40 flex flex-col gap-[22px] px-[30px] pt-[100px] pb-10 bg-white border-l border-line transition-transform duration-[400ms] ease-[cubic-bezier(.65,0,.35,1)] shadow-[-16px_0_40px_-20px_rgba(18,32,67,0.2)] ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "min(80vw, 320px)" }}
      >
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-[17px] font-semibold"
            style={{ color: "var(--ink)" }}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <a
          href="#"
          className="text-center text-[14px] font-semibold border border-line rounded-full px-5 py-[9px]"
          style={{ color: "var(--ink)" }}
          onClick={() => setMobileOpen(false)}
        >
          Log in
        </a>
        <a
          href="#"
          className="btn-solid-pill flex items-center justify-center gap-2 text-[14px] font-semibold text-white rounded-full px-[22px] py-[10px] mt-[10px]"
          style={{ background: "var(--brand)" }}
          onClick={() => setMobileOpen(false)}
        >
          Get started
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
