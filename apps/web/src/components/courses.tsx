import { Container, Card, Badge, Button } from "@flybridge/ui";

const courses = [
  {
    title: "International Career Preparation",
    description:
      "Build the confidence and skills to pursue career opportunities abroad. Covers resume strategy, interview skills, and workplace culture navigation.",
    category: "Career",
    duration: "8 weeks",
    badge: "Most Popular",
    badgeVariant: "default" as const,
  },
  {
    title: "Academic English Excellence",
    description:
      "Master the English skills needed for university applications, academic writing, and confident professional communication in global settings.",
    category: "Language",
    duration: "12 weeks",
    badge: "New",
    badgeVariant: "success" as const,
  },
  {
    title: "Global Professional Skills",
    description:
      "Develop the competencies valued by international employers — leadership, cross-cultural collaboration, and strategic communication.",
    category: "Professional",
    duration: "6 weeks",
    badge: "",
    badgeVariant: "outline" as const,
  },
  {
    title: "University Application Toolkit",
    description:
      "A complete step-by-step system for researching universities, crafting compelling applications, and securing admission to institutions abroad.",
    category: "Academic",
    duration: "4 weeks",
    badge: "",
    badgeVariant: "outline" as const,
  },
];

const categoryColors: Record<string, string> = {
  Career: "bg-gold/10 text-gold-soft border-gold/20",
  Language: "bg-signal/10 text-signal border-signal/20",
  Professional: "bg-white/5 text-mist border-edge",
  Academic: "bg-deep-2 text-mist border-edge",
};

export function Courses() {
  return (
    <section className="py-18 md:py-26 lg:py-30">
      <Container>
        <div className="tagline mb-6">
          <span className="font-mono text-mono-sm font-semibold tracking-[0.2em] text-gold uppercase">
            Start Learning
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-14 md:mb-18">
          <h2 className="font-display font-medium text-heading-lg text-paper text-balance">
            Courses built for real results
          </h2>
          <p className="text-body-lg text-mist self-end">
            Practical, expert-created content designed to help you take the next
            step — whether that&apos;s a better job, a university seat, or a new career.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
          {courses.map((course) => (
            <Card key={course.title}>
              <div className="flex items-start justify-between mb-4">
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 font-mono text-mono-sm font-semibold tracking-wide uppercase border ${categoryColors[course.category] || "bg-deep-2 text-mist border-edge"}`}>
                  {course.category}
                </span>
                {course.badge && (
                  <Badge variant={course.badgeVariant}>{course.badge}</Badge>
                )}
              </div>
              <h3 className="text-title font-semibold text-paper mb-2 font-display">
                {course.title}
              </h3>
              <p className="text-body text-mist mb-5 leading-relaxed">
                {course.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-mist-dim flex items-center gap-1.5 font-mono">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {course.duration}
                </span>
                <Button variant="ghost" size="sm" className="font-semibold">
                  Learn More
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 md:mt-14 text-center">
          <p className="text-body text-mist mb-4">
            Not sure where to start? Take our free assessment.
          </p>
          <Button size="lg">View All Courses</Button>
        </div>
      </Container>
    </section>
  );
}
