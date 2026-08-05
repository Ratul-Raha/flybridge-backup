export type ResourceType = "Guide" | "Checklist" | "Template" | "Toolkit" | "Video";

export type Resource = {
  id: string;
  title: string;
  desc: string;
  type: ResourceType;
  membersOnly?: boolean;
};

export const resources: Resource[] = [
  {
    id: "visa-checklist",
    title: "Study Visa Document Checklist",
    desc: "Every document you need for a study visa application, in one printable checklist.",
    type: "Checklist",
    membersOnly: true,
  },
  {
    id: "sop-guide",
    title: "How to Write a Standout Statement of Purpose",
    desc: "A step-by-step guide to structuring your SOP with real examples for each section.",
    type: "Guide",
  },
  {
    id: "cv-template",
    title: "International CV / Résumé Template",
    desc: "A clean, ATS-friendly template tailored for study abroad and international jobs.",
    type: "Template",
  },
  {
    id: "interview-bank",
    title: "Interview Question Bank — 50+ Questions",
    desc: "The most common visa, university and job interview questions with model answers.",
    type: "Guide",
    membersOnly: true,
  },
  {
    id: "scholarship-toolkit",
    title: "Scholarship Search Toolkit",
    desc: "Where to find scholarships, how to shortlist them, and how to apply on time.",
    type: "Toolkit",
  },
  {
    id: "bank-statement-guide",
    title: "Bank Statement & Funding Proof Guide",
    desc: "Understand how funding is assessed and how to present your documents clearly.",
    type: "Guide",
    membersOnly: true,
  },
  {
    id: "work-permit-faq",
    title: "Work Permit & Post-Study Work FAQ",
    desc: "Clear answers to the most common work-permit questions for Canada and the US.",
    type: "Guide",
  },
  {
    id: "english-idioms",
    title: "English for Interviews — Idioms & Phrases Pack",
    desc: "Natural phrases that make your interview English sound fluent and confident.",
    type: "Video",
  },
];

export const memberResources = resources.filter((r) => r.membersOnly);
