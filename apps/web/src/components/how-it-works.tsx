import { Container } from "@flybridge/ui";

const steps = [
  {
    number: "01",
    title: "Choose Your Path",
    description:
      "Browse our expert-created courses designed for your goals — whether it's career preparation, academic English, or professional skills.",
    color: "bg-gold/15 text-gold-soft border-gold/20",
  },
  {
    number: "02",
    title: "Learn at Your Pace",
    description:
      "Access step-by-step video lessons, practical guides, and real-world resources. Learn anytime, anywhere, on any device.",
    color: "bg-signal/10 text-signal border-signal/20",
  },
  {
    number: "03",
    title: "Open Global Doors",
    description:
      "Apply your new skills with confidence. Get career guidance, build your network, and take the next step toward international opportunities.",
    color: "bg-deep-2 text-mist border-edge",
  },
];

export function HowItWorks() {
  return (
    <section className="py-18 md:py-26 lg:py-30">
      <Container>
        <div className="tagline mb-6">
          <span className="font-mono text-mono-sm font-semibold tracking-[0.2em] text-gold uppercase">
            Your Journey
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-14 md:mb-18">
          <h2 className="font-display font-medium text-heading-lg text-paper text-balance">
            Three steps to your international future
          </h2>
          <p className="text-body-lg text-mist self-end">
            No complicated processes. Just clear, practical steps that take you from where you are to where you want to be.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center group">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-edge" />
              )}
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border font-display text-title font-semibold transition-colors duration-300 group-hover:border-gold/40 ${step.color}`}>
                {step.number}
              </div>
              <h3 className="text-title font-semibold text-paper mb-3 font-display">
                {step.title}
              </h3>
              <p className="text-body text-mist leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
