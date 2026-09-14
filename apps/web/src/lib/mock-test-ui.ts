export type MockTestSkill = "reading" | "listening" | "writing" | "speaking";

export type BundleDto = {
  id: string;
  title: string;
  slug: string;
  description: string;
  badge: string;
  image: string | null;
  price: number;
  currency: string;
  prices?: { USD?: number; BDT?: number } | null;
  featured: boolean;
  published: boolean;
  testCount: number;
  skills: { reading: number; listening: number; writing: number; speaking: number };
  createdAt: string;
  updatedAt: string;
};

export type TestListItem = {
  id: string;
  bundle: { id: string; title: string; slug: string; price: number; currency: string };
  course: { id: string; title: string; slug: string } | null;
  title: string;
  skill: MockTestSkill;
  status: string;
  durationMinutes: number;
  questionCount: number;
  order: number;
  owned: boolean;
  createdAt: string;
};

export type TestDetail = {
  id: string;
  bundle: { id: string; title: string; slug: string; price: number; currency: string } | null;
  course: { id: string; title: string; slug: string } | null;
  title: string;
  skill: MockTestSkill;
  status: string;
  durationMinutes: number;
  questionCount: number;
  owned: boolean;
  content: {
    type: MockTestSkill;
    passage?: string;
    passages?: {
      id?: string;
      title?: string;
      text: string;
    }[];
    audioUrl?: string;
    videoUrl?: string;
    hasAudio?: boolean;
    sections: {
      id?: string;
      passageId?: string;
      type?: string;
      instructions?: string;
      passage?: string;
      image?: string;
      imagePlacement?: "above" | "below-passage" | "below";
      questions: {
        qid: string;
        type?: string;
        prompt?: string;
        options: string[];
        answer?: string;
        passageRef?: string;
        wordHint?: string;
      }[];
    }[];
    writingTask1?: string;
    writingTask2?: string;
    writingTask1Image?: string;
    writingTask1ImagePlacement?: "above" | "below";
    writingTask2Image?: string;
    writingTask2ImagePlacement?: "above" | "below";
  };
  createdAt: string;
};

export type AttemptListItem = {
  id: string;
  testId: string;
  title: string;
  skill: string;
  status: string;
  band: number | null;
  submittedAt: string | null;
};

export type AnswerValue = { choice?: number; text?: string };

export type AttemptDetail = {
  id: string;
  testId: string;
  title: string;
  skill: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  timedOut: boolean;
  answers: Record<string, AnswerValue>;
  result: {
    overallBand: number;
    sections: { key: string; title: string; band: number; comments: string }[];
    feedback: string;
  } | null;
};

export const SKILL_META: Record<MockTestSkill, { label: string; accent: string; soft: string }> = {
  reading: { label: "Reading", accent: "#2F5FE0", soft: "rgba(47,95,224,0.10)" },
  listening: { label: "Listening", accent: "#6B4CE0", soft: "rgba(111,76,224,0.10)" },
  writing: { label: "Writing", accent: "#E08A17", soft: "rgba(224,138,23,0.10)" },
  speaking: { label: "Speaking", accent: "#0FA968", soft: "rgba(15,169,104,0.10)" },
};

export function skillLabel(skill: string): string {
  return SKILL_META[(skill as MockTestSkill) ?? "reading"]?.label ?? skill;
}

export function formatPrice(price: number, currency = "USD"): string {
  if (price <= 0) return "Free";
  if (currency === "USD") return `$${price.toLocaleString()}`;
  if (currency === "BDT") return `৳${price.toLocaleString()}`;
  return `${price.toLocaleString()} ${currency}`;
}