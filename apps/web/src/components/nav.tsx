"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";

const links = [
  { label: "Programs", href: "/programs" },
  { label: "Seminars", href: "/seminars" },
  { label: "Partnership", href: "/partnership" },
  { label: "Resources", href: "/resources" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();

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
        className={`navbar fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-shadow duration-300 px-[clamp(20px,4.5vw,56px)] py-[18px] ${
          scrolled
            ? "shadow-[0_6px_24px_-12px_rgba(18,32,67,0.12)] border-b border-line"
            : "shadow-none border-b border-transparent"
        }`}
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}
      >
        <div className="flex w-full max-w-[1320px] mx-auto items-center justify-between">
        <a href="/" className="brand flex flex-col items-start leading-none">
          <Image
            src="/transparent-logo-dark.png"
            alt="FlyBridge Education Group"
            width={113}
            height={38}
            className="w-auto h-[34px] shrink-0 object-contain"
            priority
          />
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

          {user && <NotificationBell />}

          {loading ? (
            <div className="w-[38px] h-[38px] rounded-full" style={{ background: "var(--line)" }} />
          ) : user ? (
            <a
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-full border border-line bg-white pl-[5px] pr-4 py-[5px] hover:border-brand-2 transition-all duration-250"
              aria-label="Open dashboard"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-[28px] h-[28px] rounded-full object-cover" />
              ) : (
                <div
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="hidden md:block text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                {user.name.split(" ")[0]}
              </span>
            </a>
          ) : (
            <>
          <a
            href="/login"
            className="hidden sm:inline-flex text-[14px] font-medium border border-line rounded-full px-5 py-[9px] hover:border-brand-2 hover:text-brand-2 transition-all duration-250"
            style={{ color: "var(--ink)" }}
          >
            Log in
          </a>

          <a
            href="/login?mode=register"
            className="btn-solid-pill hidden sm:inline-flex items-center gap-2 text-[14px] font-medium text-white rounded-full px-[22px] py-[10px] hover:translate-y-[-1px] transition-all duration-250"
            style={{ background: "var(--brand)" }}
          >
            Get started
            <svg className="w-[14px] h-[14px] group-hover:translate-x-[3px] transition-transform duration-250" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          </>
          )}

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
            className="text-[17px] font-medium"
            style={{ color: "var(--ink)" }}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>
        ))}
        {user ? (
          <a
            href="/dashboard"
            className="flex items-center gap-3 border border-line rounded-full pl-[6px] pr-5 py-[6px] w-fit"
            onClick={() => setMobileOpen(false)}
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="w-[30px] h-[30px] rounded-full object-cover" />
            ) : (
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
              My dashboard
            </span>
          </a>
        ) : (
          <>
        <a
          href="/login"
          className="text-center text-[14px] font-medium border border-line rounded-full px-5 py-[9px]"
          style={{ color: "var(--ink)" }}
          onClick={() => setMobileOpen(false)}
        >
          Log in
        </a>
        <a
          href="/login?mode=register"
          className="btn-solid-pill flex items-center justify-center gap-2 text-[14px] font-medium text-white rounded-full px-[22px] py-[10px] mt-[10px]"
          style={{ background: "var(--brand)" }}
          onClick={() => setMobileOpen(false)}
        >
          Get started
          <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        </>
        )}
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
