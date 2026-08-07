export type Program = {
  slug: string;
  badge: string;
  title: string;
  desc: string;
  bg: string;
  badgeColor: string;
  upcoming?: boolean;
  price?: string;
  image?: string;
};

export const programs: Program[] = [
  {
    slug: "study-visa-prep-us",
    badge: "STUDY ABROAD",
    title: "Student Visa Blueprint™",
    desc: "The complete step-by-step system to prepare your study visa application with confidence.",
    bg: "var(--blue-bg)",
    badgeColor: "var(--blue-ink)",
    price: "৳২,৯৯৯",
    image: "/watermark.png",
  },
  {
    slug: "obocheton-mone-ilish-level-01",
    badge: "ENGLISH",
    title: "অবচেতন মনে ইংলিশ-Level 01",
    desc: "Practical, confident communication for everyday and interviews.",
    bg: "var(--lav-bg)",
    badgeColor: "var(--lav-ink)",
    image: "/programs/english.jpg",
  },
  {
    slug: "work-permit-prep-canada",
    badge: "WORK ABROAD",
    title: "Work Permit Blueprint - Canada",
    desc: "Eligibility, documentation and job-search groundwork.",
    bg: "var(--mint-bg)",
    badgeColor: "var(--mint-ink)",
    upcoming: true,
    image: "/programs/work-permit-blueprint.png",
  },
  {
    slug: "interview-readiness",
    badge: "CAREER PREP",
    title: "Interview Readiness",
    desc: "Frameworks, mock questions and confident delivery.",
    bg: "var(--peach-bg)",
    badgeColor: "var(--peach-ink)",
    upcoming: true,
    image: "/programs/interview-blueprint.jpg",
  },
];

export function getProgram(slug: string) {
  return programs.find((p) => p.slug === slug);
}
