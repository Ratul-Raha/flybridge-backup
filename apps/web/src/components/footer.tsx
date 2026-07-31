"use client";

import { Container, Button } from "@flybridge/ui";

const footerLinks = [
  {
    title: "Learn",
    links: ["Programs", "English", "Pricing", "FAQ"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Support",
    links: ["Help Center", "Community", "Privacy", "Terms"],
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
                    <li key={link}>
                      <a
                        href="#"
                        className="text-body-sm text-mist-dim transition-colors hover:text-paper"
                      >
                        {link}
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
            <a href="#" className="font-mono text-mono-sm text-mist-dim hover:text-paper transition-colors">
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
