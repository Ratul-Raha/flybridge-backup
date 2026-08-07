"use client";

import Image from "next/image";
import { Container } from "@flybridge/ui";

const footerLinks = [
  {
    title: "Learn",
    links: [
      { label: "Programs", href: "/programs" },
      { label: "Resources", href: "/resources" },
      { label: "English", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "https://coachrasel.com" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "#" },
    ],
  },
];

const socialLinks = ["Twitter", "LinkedIn", "YouTube", "Instagram"];

export function Footer() {
  return (
    <footer className="border-t border-edge">
      <Container>
        <div className="py-14 md:py-18">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-14 md:mb-18">
            <div className="col-span-2 md:col-span-2">
              <a href="/" className="brand flex flex-col items-start leading-none mb-4">
                <Image
                  src="/logo.png"
                  alt="FlyBridge Education Group"
                  width={113}
                  height={38}
                  className="w-auto h-[30px] shrink-0 object-contain"
                  priority
                />
                <span className="font-mono text-[9px] tracking-[1.8px] mt-[3px] text-mist-dim">
                  EDUCATION GROUP
                </span>
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
                    key={s}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-mist-dim hover:text-paper hover:border-signal transition-colors font-mono text-mono-sm font-semibold"
                  >
                    {s.charAt(0)}
                  </a>
                ))}
              </div>
              <a
                href="https://wa.me/8801684566828"
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
            <a href="#" className="font-mono text-mono-sm text-mist-dim hover:text-paper transition-colors">
              Terms
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
