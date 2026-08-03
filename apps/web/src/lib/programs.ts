export type Program = {
  slug: string;
  badge: string;
  title: string;
  desc: string;
  bg: string;
  badgeColor: string;
  upcoming?: boolean;
};

export const programs: Program[] = [
  {
    slug: "study-visa-prep-us",
    badge: "STUDY ABROAD",
    title: "Study Visa Prep",
    desc: "From application to visa interview, mapped out end to end.",
    bg: "var(--blue-bg)",
    badgeColor: "var(--blue-ink)",
  },
  {
    slug: "obocheton-mone-ilish-level-01",
    badge: "ENGLISH",
    title: "অবচেতন মনে ইলিশ Level 01",
    desc: "Practical, confident communication for everyday and interviews.",
    bg: "var(--lav-bg)",
    badgeColor: "var(--lav-ink)",
  },
  {
    slug: "work-permit-prep-canada",
    badge: "WORK ABROAD",
    title: "Work Permit Prep — Canada",
    desc: "Eligibility, documentation and job-search groundwork.",
    bg: "var(--mint-bg)",
    badgeColor: "var(--mint-ink)",
    upcoming: true,
  },
  {
    slug: "interview-readiness",
    badge: "CAREER PREP",
    title: "Interview Readiness",
    desc: "Frameworks, mock questions and confident delivery.",
    bg: "var(--peach-bg)",
    badgeColor: "var(--peach-ink)",
    upcoming: true,
  },
];

export function getProgram(slug: string) {
  return programs.find((p) => p.slug === slug);
}
