import { Container, Card } from "@flybridge/ui";

const testimonials = [
  {
    quote: "FlyBridge gave me the structure and confidence I needed. The career preparation course helped me land a job in Toronto within three months of completing it.",
    name: "Sadia Rahman",
    location: "Dhaka, Bangladesh",
    initials: "SR",
  },
  {
    quote: "The Academic English course was exactly what I needed for my university application. I scored 7.5 on IELTS and got accepted to my dream program.",
    name: "Arun Patel",
    location: "Mumbai, India",
    initials: "AP",
  },
  {
    quote: "What sets FlyBridge apart is the practical focus. Every module had real-world applications. I finally feel prepared for my international career.",
    name: "Priya Sharma",
    location: "Kathmandu, Nepal",
    initials: "PS",
  },
];

export function Testimonials() {
  return (
    <section className="py-18 md:py-26 lg:py-30">
      <Container>
        <div className="tagline mb-6">
          <span className="font-mono text-mono-sm font-semibold tracking-[0.2em] text-gold uppercase">
            Success Stories
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-14 md:mb-18">
          <h2 className="font-display font-medium text-heading-lg text-paper text-balance">
            Real stories from real learners
          </h2>
          <p className="text-body-lg text-mist self-end">
            Thousands of students have transformed their futures through practical education. Here are a few of their stories.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} hover={false}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-edge mb-4">
                <path d="M11 6v5H6v5h5v5H6v-5H1v-5h5V6h5zm12 0v5h-5v5h5v5h-5v-5h-5v-5h5V6h5z" />
              </svg>
              <blockquote className="text-body text-mist mb-6 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold-soft font-mono text-body-sm font-bold">
                  {t.initials}
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-paper">{t.name}</p>
                  <p className="font-mono text-mono-sm text-mist-dim">{t.location}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
