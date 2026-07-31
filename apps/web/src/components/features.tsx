import { Container, Card } from "@flybridge/ui";

const promises = [
  {
    title: "Learn from Experts",
    description:
      "Every course is built by industry professionals who understand the real-world skills needed to succeed internationally.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Practical Skills First",
    description:
      "Hands-on projects, real case studies, and actionable resources — not just theory. Apply what you learn immediately.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    title: "Career-Focused Guidance",
    description:
      "From course selection to career planning, we provide clear pathways that connect your learning to real international opportunities.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
  },
  {
    title: "Global Community",
    description:
      "Join ambitious learners from Bangladesh, India, Nepal, and beyond. Learn together, share experiences, and grow your network.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section className="py-18 md:py-26 lg:py-30">
      <Container>
        <div className="tagline mb-6">
          <span className="font-mono text-mono-sm font-semibold tracking-[0.2em] text-gold uppercase">
            Our Promise
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-14 md:mb-18">
          <div>
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gold/10 text-gold font-display text-title font-bold mb-4">
              01
            </span>
            <h2 className="font-display font-medium text-heading-lg text-paper text-balance">
              Designed for your success, not just paperwork
            </h2>
          </div>
          <p className="text-body-lg text-mist self-end">
            We believe in practical education that opens doors. Here&apos;s how we help you build a real international future — with expert guidance, actionable skills, and a community that supports you every step of the way.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
          {promises.map((item) => (
            <Card key={item.title}>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-soft">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-title font-semibold text-paper mb-1.5 font-display">
                    {item.title}
                  </h3>
                  <p className="text-body text-mist leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
