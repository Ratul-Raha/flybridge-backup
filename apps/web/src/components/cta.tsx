import { Container, Button } from "@flybridge/ui";

export function CTA() {
  return (
    <section className="py-18 md:py-26 lg:py-30">
      <Container narrow>
        <div className="rounded-3xl border border-edge bg-gradient-to-br from-deep via-deep/80 to-deep/60 p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-gold/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-signal/4 blur-[80px] translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="tagline justify-center mb-6">
              <span className="font-mono text-mono-sm font-semibold tracking-[0.2em] text-gold uppercase">
                Get Started
              </span>
            </div>

            <h2 className="font-display font-medium text-heading-lg text-paper text-balance mb-4">
              Ready to build your international future?
            </h2>
            <p className="text-body-lg text-mist text-balance mx-auto max-w-lg mb-10">
              Join thousands of ambitious learners already preparing for global opportunities with FlyBridge.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Start Learning Free
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                </svg>
              </Button>
              <Button variant="outline" size="lg">
                Talk to an Advisor
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
