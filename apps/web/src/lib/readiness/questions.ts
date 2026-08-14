export type ReadinessCategoryId =
  | "academic"
  | "language"
  | "funding"
  | "profile"
  | "planning";

export type ReadinessQuestionId =
  | "education"
  | "academics"
  | "english"
  | "finance"
  | "experience"
  | "timeline"
  | "goals"
  | "targetCountry";

export type ReadinessOption = {
  value: string;
  label: string;
  hint?: string;
  points: number;
};

export type ReadinessQuestion = {
  id: ReadinessQuestionId;
  category: ReadinessCategoryId;
  title: string;
  subtitle: string;
  options: ReadinessOption[];
  scored: boolean;
};

export type ReadinessAnswers = Partial<Record<ReadinessQuestionId, string>>;

export type CategoryScore = {
  id: ReadinessCategoryId;
  label: string;
  pct: number;
  points: number;
  maxPoints: number;
};

export type ReadinessDetail = {
  questionId: ReadinessQuestionId;
  question: string;
  answer: string;
  points: number;
  maxPoints: number;
};

export type ReadinessResult = {
  score: number;
  label: string;
  tagline: string;
  categories: CategoryScore[];
  details: ReadinessDetail[];
};

export const CATEGORY_LABELS: Record<ReadinessCategoryId, string> = {
  academic: "Academic profile",
  language: "Language readiness",
  funding: "Funding readiness",
  profile: "Profile & experience",
  planning: "Planning & timeline",
};

export const READINESS_QUESTIONS: ReadinessQuestion[] = [
  {
    id: "education",
    category: "academic",
    title: "What is your highest level of education so far?",
    subtitle: "This helps us understand your academic starting point.",
    scored: true,
    options: [
      {
        value: "high-school",
        label: "High school",
        hint: "HSC / A-Levels or equivalent",
        points: 1,
      },
      {
        value: "bachelors",
        label: "Bachelor's degree",
        hint: "BSc / BA / BBA or equivalent",
        points: 2,
      },
      {
        value: "masters",
        label: "Master's degree",
        hint: "MSc / MA / MBA or equivalent",
        points: 3,
      },
    ],
  },
  {
    id: "academics",
    category: "academic",
    title: "How has your academic performance been?",
    subtitle: "Universities weigh your grades heavily — be honest.",
    scored: true,
    options: [
      {
        value: "excellent",
        label: "Excellent",
        hint: "CGPA 3.5+ or First class",
        points: 4,
      },
      {
        value: "good",
        label: "Good",
        hint: "CGPA 3.0–3.4 or Upper second",
        points: 3,
      },
      {
        value: "average",
        label: "Average",
        hint: "CGPA 2.5–2.9 or Second class",
        points: 2,
      },
      {
        value: "weak",
        label: "Below average",
        hint: "CGPA below 2.5",
        points: 1,
      },
    ],
  },
  {
    id: "english",
    category: "language",
    title: "How strong is your English right now?",
    subtitle: "Visa and admission offices check language proficiency.",
    scored: true,
    options: [
      {
        value: "native",
        label: "Native or near-native",
        points: 4,
      },
      {
        value: "advanced",
        label: "Advanced",
        hint: "IELTS 6.5+ / TOEFL 90+",
        points: 3,
      },
      {
        value: "intermediate",
        label: "Intermediate",
        hint: "Comfortable in daily conversation",
        points: 2,
      },
      {
        value: "beginner",
        label: "Beginner",
        hint: "Still learning the basics",
        points: 1,
      },
    ],
  },
  {
    id: "finance",
    category: "funding",
    title: "How will you fund your studies abroad?",
    subtitle: "Proof of funds is a core visa requirement.",
    scored: true,
    options: [
      {
        value: "secured",
        label: "Fully funded",
        hint: "Scholarship or complete savings",
        points: 4,
      },
      {
        value: "savings",
        label: "Strong savings",
        hint: "Savings plus family support",
        points: 3,
      },
      {
        value: "partial",
        label: "Partially funded",
        hint: "Planning loans or part-time work",
        points: 2,
      },
      {
        value: "exploring",
        label: "Not started yet",
        hint: "Still exploring funding options",
        points: 1,
      },
    ],
  },
  {
    id: "experience",
    category: "profile",
    title: "Do you have experience that strengthens your application?",
    subtitle: "Internships, jobs, volunteering, projects or leadership.",
    scored: true,
    options: [
      {
        value: "strong",
        label: "Yes, quite a bit",
        hint: "Multiple internships, jobs or projects",
        points: 4,
      },
      {
        value: "some",
        label: "A little",
        hint: "One or two relevant activities",
        points: 3,
      },
      {
        value: "limited",
        label: "Very little",
        points: 2,
      },
      {
        value: "none",
        label: "Not yet",
        points: 1,
      },
    ],
  },
  {
    id: "timeline",
    category: "planning",
    title: "When do you plan to start applying?",
    subtitle: "Deadlines shape the pace of your preparation.",
    scored: true,
    options: [
      {
        value: "within6",
        label: "Within 6 months",
        points: 4,
      },
      {
        value: "withinYear",
        label: "6–12 months",
        points: 3,
      },
      {
        value: "later",
        label: "1–2 years",
        points: 2,
      },
      {
        value: "exploring",
        label: "Just exploring",
        points: 1,
      },
    ],
  },
  {
    id: "goals",
    category: "planning",
    title: "How clear are your study and career goals?",
    subtitle: "Clear goals make for stronger applications.",
    scored: true,
    options: [
      {
        value: "clear",
        label: "Very clear",
        hint: "I know the program and path",
        points: 4,
      },
      {
        value: "direction",
        label: "A direction",
        hint: "I have an idea but stay flexible",
        points: 3,
      },
      {
        value: "researching",
        label: "Still researching",
        points: 2,
      },
      {
        value: "unsure",
        label: "Not sure yet",
        points: 1,
      },
    ],
  },
  {
    id: "targetCountry",
    category: "planning",
    title: "Which country are you aiming for?",
    subtitle: "Not scored — it helps us tailor your report.",
    scored: false,
    options: [
      {
        value: "canada",
        label: "Canada",
        points: 0,
      },
      {
        value: "usa",
        label: "USA",
        points: 0,
      },
      {
        value: "uk",
        label: "United Kingdom",
        points: 0,
      },
      {
        value: "europe",
        label: "Europe",
        points: 0,
      },
      {
        value: "anywhere",
        label: "Open to any country",
        points: 0,
      },
    ],
  },
];

export const READINESS_QUESTION_IDS: ReadinessQuestionId[] =
  READINESS_QUESTIONS.map((q) => q.id);

export function questionById(id: ReadinessQuestionId): ReadinessQuestion {
  return READINESS_QUESTIONS.find((q) => q.id === id)!;
}

export function isReadinessAnswer(value: unknown): value is ReadinessAnswers {
  if (typeof value !== "object" || value === null) return false;
  for (const q of READINESS_QUESTIONS) {
    const answer = (value as Record<string, unknown>)[q.id];
    if (typeof answer !== "string") return false;
    if (!q.options.some((o) => o.value === answer)) return false;
  }
  return true;
}

export function computeReadiness(answers: ReadinessAnswers): ReadinessResult {
  const scored = READINESS_QUESTIONS.filter((q) => q.scored);
  const scoredIds = new Set(scored.map((q) => q.id));

  let totalPoints = 0;
  let totalMax = 0;

  const details: ReadinessDetail[] = READINESS_QUESTIONS.map((q) => {
    const selected = q.options.find((o) => o.value === answers[q.id]);
    const points = selected?.points ?? 0;
    const maxPoints = Math.max(...q.options.map((o) => o.points));
    if (scoredIds.has(q.id)) {
      totalPoints += points;
      totalMax += maxPoints;
    }
    return {
      questionId: q.id,
      question: q.title,
      answer: selected?.label ?? "Not answered",
      points,
      maxPoints,
    };
  });

  const categories: CategoryScore[] = (Object.keys(CATEGORY_LABELS) as ReadinessCategoryId[]).map(
    (id) => {
      const catScored = scored.filter((q) => q.category === id);
      const catIds = new Set(catScored.map((q) => q.id));
      let points = 0;
      let maxPoints = 0;
      for (const d of details) {
        if (!catIds.has(d.questionId)) continue;
        points += d.points;
        maxPoints += d.maxPoints;
      }
      return {
        id,
        label: CATEGORY_LABELS[id],
        points,
        maxPoints,
        pct: maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0,
      };
    }
  );

  const score = totalMax > 0 ? Math.round((totalPoints / totalMax) * 100) : 0;

  const verdict = verdictFor(score);
  return {
    score,
    label: verdict.label,
    tagline: verdict.tagline,
    categories,
    details,
  };
}

export function verdictFor(score: number): { label: string; tagline: string } {
  if (score >= 80) {
    return {
      label: "Strong candidate",
      tagline:
        "You're in great shape. With sharp documents and timely applications, you have a realistic path to your goals.",
    };
  }
  if (score >= 60) {
    return {
      label: "Good foundation",
      tagline:
        "You have solid groundwork. A few targeted improvements could meaningfully boost your chances.",
    };
  }
  if (score >= 40) {
    return {
      label: "Building momentum",
      tagline:
        "You're on the right track, but a few areas need real work before applications open.",
    };
  }
  return {
    label: "Early stage",
    tagline:
      "Everyone starts somewhere. Focus on the fundamentals first — your path abroad is still very buildable.",
  };
}