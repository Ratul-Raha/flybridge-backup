"use client";

import { Container, Button } from "@flybridge/ui";

const footerLinks = [
  {
    title: "Learn",
    links: [
      { label: "Programs", href: "/programs" },
      { label: "English", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "#" },
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
              <a href="/" className="brand flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-paper mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold-soft via-gold to-signal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 17L10 10L14 14L21 6" stroke="#0B1420" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                FlyBridge
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

          <div className="border-t border-edge pt-10 md:pt-12">
            <div className="max-w-lg">
              <h4 className="font-display text-title font-semibold text-paper mb-2">
                Stay in the loop
              </h4>
              <p className="text-body-sm text-mist-dim mb-5">
                Get the latest on new courses, career opportunities, and study abroad insights.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-3"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 rounded-full border border-edge bg-ink/50 px-5 py-2.5 text-body-sm text-paper placeholder:text-mist-dim/60 outline-none focus:border-gold/50 transition-colors"
                />
                <Button size="sm" type="submit">
                  Subscribe
                </Button>
              </form>
            </div>
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
