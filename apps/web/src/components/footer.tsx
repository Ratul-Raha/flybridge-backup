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
      { label: "English", href: "/programs/easy-smart-spoken-english" },
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
    label: "YouTube",
    href: "https://youtube.com/@flybridgeedu",
    color: "#FF0000",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@flybridgeedu",
    color: "#000000",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.11v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 10.86 4.43v-7.15a8.16 8.16 0 0 0 5.58 2.18v-3.45a4.85 4.85 0 0 1-2.85-.91 4.83 4.83 0 0 1-1.85-3.61h2.9z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/flybridgeedu",
    color: "#E4405F",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://x.com/flybridgeedu",
    color: "#000000",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Threads",
    href: "https://threads.com/@flybridgeedu",
    color: "#000000",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.34-.776-.963-1.394-1.813-1.79-.128 2.754-1.19 5.072-3.222 6.66-1.52 1.19-3.39 1.738-5.475 1.555-1.935-.17-3.586-.846-4.77-1.935-1.314-1.21-2.08-2.885-2.152-4.638-.072-1.753.615-3.41 1.928-4.622 1.184-1.097 2.808-1.773 4.722-1.922 1.918-.148 3.604.374 4.898 1.471l-1.53 1.49c-1.896-1.62-3.977-1.547-4.978-1.547l.114.27c-1.843.05-3.32.53-4.262 1.399-.98.906-1.433 2.168-1.344 3.56.09 1.39.637 2.642 1.55 3.54 1.007.986 2.423 1.59 4.088 1.736 1.866.164 3.537-.315 4.797-1.405 1.002-.87 1.677-2.125 1.967-3.583.184-.932.185-1.873.006-2.776a6.685 6.685 0 0 0-.39-1.248c.848.394 1.493.893 1.894 1.49.59.886.741 1.994.438 3.36-.318 1.414-1.146 2.64-2.425 3.578C17.634 22.208 15.323 22.99 12.186 24zM10.8 14.295c-.082 1.94.52 3.596 1.742 4.712.985.906 2.254 1.374 3.676 1.298 1.14-.062 2.14-.512 2.896-1.3 1.034-1.081 1.06-2.442.454-3.67a5.23 5.23 0 0 0-.358-.547c-.384-.475-.883-.86-1.474-1.136-.57.538-1.27.942-2.063 1.182-.798.242-1.57.284-2.254.096a3.446 3.446 0 0 1-1.376-.683c.149-.083.365-.176.643-.275l.114-.041-.004-.232z" />
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
