"use client";

import Image from "next/image";
import { Container } from "@flybridge/ui";

const footerLinks = [
  {
    title: "Learn",
    links: [
      { label: "Programs", href: "/programs" },
      { label: "Check Eligibility", href: "/readiness" },
      { label: "Scholarships", href: "/scholarships" },
      { label: "Resources", href: "/resources" },
      { label: "English", href: "#" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blogs" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "#",
    color: "#1877F2",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    color: "#E4405F",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    color: "#FF0000",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    color: "#0A66C2",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="border-t border-edge">
      <Container>
        <div className="py-14 md:py-18">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-14 md:mb-18">
            <div className="col-span-2 md:col-span-2">
              <a href="/" className="brand flex flex-col items-start leading-none mb-4">
                <Image
                  src="/transparent-logo-dark.png"
                  alt="FlyBridge Education Group"
                  width={113}
                  height={38}
                  className="w-auto h-[30px] shrink-0 object-contain"
                  priority
                />
              </a>
              <p className="text-body-sm text-mist-dim max-w-xs mb-6 leading-relaxed">
                Helping ambitious people around the world build an international future through practical, expert-led education.
              </p>
              <div className="space-y-2 mb-6">
                <a
                  href="https://maps.google.com/?q=757+Gladstone+Avenue+Toronto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-body-sm text-mist-dim hover:text-paper transition-colors max-w-xs"
                >
                  <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 10C20 16 12 22 12 22C12 22 4 16 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10Z" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>
                    757 Gladstone Avenue,<br />Toronto, ON M6H 3J5, Canada
                  </span>
                </a>
                <a
                  href="tel:+17786768459"
                  className="flex items-center gap-2.5 text-body-sm text-mist-dim hover:text-paper transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.92V19.5C22 20.33 21.33 21 20.5 21C10.51 21 3 13.49 3 3.5C3 2.67 3.67 2 4.5 2H7.08C7.78 2 8.38 2.44 8.56 3.12L9.57 6.64C9.74 7.32 9.49 8.03 8.93 8.44L7.58 9.58C8.68 12.56 11.44 15.32 14.42 16.42L15.56 15.07C15.97 14.51 16.68 14.26 17.36 14.43L20.88 15.44C21.56 15.62 22 16.22 22 16.92Z" strokeLinejoin="round" />
                  </svg>
                  +1 778 676 8459
                </a>
              </div>
              <div className="flex items-center gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge transition-all duration-200 hover:-translate-y-[1px]"
                    style={{ color: s.color }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
              <a
                href="https://wa.me/17786768459"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-6 py-3 text-body-sm font-semibold text-ink transition-transform hover:-translate-y-[1px]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Talk to us
              </a>
            </div>

            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="font-mono text-mono-sm font-semibold text-mist tracking-wide uppercase mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-body-sm text-mist-dim transition-colors hover:text-paper"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-edge py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-mono-sm text-mist-dim">
            &copy; {new Date().getFullYear()} FlyBridge Education Group. Toronto, Canada.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="font-mono text-mono-sm text-mist-dim hover:text-paper transition-colors">
              Privacy
            </a>
            <a href="/terms" className="font-mono text-mono-sm text-mist-dim hover:text-paper transition-colors">
              Terms
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
