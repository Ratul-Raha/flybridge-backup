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
  | "visa"
  | "targetCountry"
  | "degreeLevel";

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
  multiSelect?: boolean;
};

export type ReadinessAnswers = Partial<Record<ReadinessQuestionId, string | string[]>>;

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

export type PriorityArea = {
  questionId: ReadinessQuestionId;
  label: string;
  pct: number;
};

export type ReadinessResult = {
  score: number;
  label: string;
  tagline: string;
  categories: CategoryScore[];
  details: ReadinessDetail[];
  priorityAreas: PriorityArea[];
};

export const CATEGORY_LABELS: Record<ReadinessCategoryId, string> = {
  academic: "Academic profile",
  language: "Language readiness",
  funding: "Funding readiness",
  profile: "Profile & experience",
  planning: "Planning & timeline",
};

export const READINESS_LABELS: Record<ReadinessQuestionId, string> = {
  education: "Education level",
  academics: "Academic performance",
  english: "English proficiency",
  finance: "Financial readiness",
  experience: "Profile strength",
  timeline: "Application timeline",
  goals: "Goal clarity",
  visa: "Visa & travel history",
  targetCountry: "Destination country",
  degreeLevel: "Degree level",
};

export const READINESS_WEIGHTS: Record<ReadinessQuestionId, number> = {
  education: 0.1,
  academics: 0.15,
  english: 0.15,
  finance: 0.2,
  experience: 0.15,
  timeline: 0.1,
  goals: 0.1,
  visa: 0.05,
  targetCountry: 0,
  degreeLevel: 0,
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
        points: 40,
      },
      {
        value: "currently-studying",
        label: "Currently studying",
        hint: "Bachelor's or Master's, not yet completed",
        points: 60,
      },
      {
        value: "bachelors",
        label: "Bachelor's (completed)",
        points: 80,
      },
      {
        value: "masters",
        label: "Master's (completed)",
        points: 100,
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
        hint: "CGPA 3.5+ / First class",
        points: 100,
      },
      {
        value: "good",
        label: "Good",
        hint: "CGPA 3.0–3.4 / Upper second",
        points: 75,
      },
      {
        value: "average",
        label: "Average",
        hint: "CGPA 2.5–2.9 / Second class",
        points: 50,
      },
      {
        value: "weak",
        label: "Below average",
        hint: "CGPA below 2.5",
        points: 25,
      },
    ],
  },
  {
    id: "english",
    category: "language",
    title: "What's your current English test status?",
    subtitle: "Visa and admission offices check language proficiency.",
    scored: true,
    options: [
      {
        value: "strong-score",
        label: "Already have a strong score",
        hint: "IELTS 6.5+ / TOEFL 90+",
        points: 100,
      },
      {
        value: "below-target",
        label: "Have taken it, score below target",
        points: 60,
      },
      {
        value: "not-taken-comfortable",
        label: "Haven't taken it yet, comfortable in English",
        points: 50,
      },
      {
        value: "not-taken-weak",
        label: "Haven't taken it yet, English is a weak point",
        points: 20,
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
        value: "fully-funded",
        label: "Fully funded",
        hint: "Scholarship or sponsor secured",
        points: 100,
      },
      {
        value: "strong-savings",
        label: "Strong savings",
        hint: "Can cover most costs",
        points: 75,
      },
      {
        value: "partial",
        label: "Partially funded",
        hint: "Need a loan or additional support",
        points: 50,
      },
      {
        value: "unplanned",
        label: "Haven't planned finances yet",
        points: 20,
      },
    ],
  },
  {
    id: "experience",
    category: "profile",
    title: "Which of these do you have? (select all that apply)",
    subtitle: "Internships, jobs, projects, leadership or certifications.",
    scored: true,
    multiSelect: true,
    options: [
      {
        value: "internship",
        label: "Internship or job experience",
        points: 25,
      },
      {
        value: "research",
        label: "Research or academic projects / publications",
        points: 25,
      },
      {
        value: "leadership",
        label: "Extracurricular leadership",
        hint: "Clubs, competitions, volunteering",
        points: 25,
      },
      {
        value: "certifications",
        label: "Relevant certifications or online courses",
        points: 25,
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
        points: 100,
      },
      {
        value: "withinYear",
        label: "6–12 months",
        points: 75,
      },
      {
        value: "later",
        label: "1–2 years",
        points: 50,
      },
      {
        value: "exploring",
        label: "Just exploring",
        points: 25,
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
        hint: "Know program, school targets and career path",
        points: 100,
      },
      {
        value: "direction",
        label: "Have a direction",
        hint: "Know the field, not the specifics",
        points: 70,
      },
      {
        value: "researching",
        label: "Still researching",
        points: 40,
      },
      {
        value: "unsure",
        label: "Not sure yet",
        points: 15,
      },
    ],
  },
  {
    id: "visa",
    category: "planning",
    title: "What's your visa or international travel history?",
    subtitle: "Immigration history can shape your application strategy.",
    scored: true,
    options: [
      {
        value: "traveled",
        label: "Have traveled abroad before, no visa refusals",
        points: 100,
      },
      {
        value: "no-history",
        label: "No prior visa or travel history",
        points: 70,
      },
      {
        value: "unsure",
        label: "Not sure / prefer not to say",
        points: 60,
      },
      {
        value: "refused",
        label: "Have been refused a visa before",
        points: 30,
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
  {
    id: "degreeLevel",
    category: "planning",
    title: "What level do you want to study abroad?",
    subtitle: "Not scored — used to tailor your advice.",
    scored: false,
    options: [
      {
        value: "foundation",
        label: "Foundation / Diploma",
        points: 0,
      },
      {
        value: "bachelors",
        label: "Bachelor's",
        points: 0,
      },
      {
        value: "masters",
        label: "Master's",
        points: 0,
      },
      {
        value: "phd",
        label: "PhD",
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
    if (q.multiSelect) {
      if (!Array.isArray(answer) || answer.length === 0) return false;
      for (const v of answer) {
        if (typeof v !== "string") return false;
        if (!q.options.some((o) => o.value === v)) return false;
      }
    } else {
      if (typeof answer !== "string") return false;
      if (!q.options.some((o) => o.value === answer)) return false;
    }
  }
  return true;
}

export function computeReadiness(answers: ReadinessAnswers): ReadinessResult {
  const scored = READINESS_QUESTIONS.filter((q) => q.scored);
  const scores = new Map<ReadinessQuestionId, number>();

  const details: ReadinessDetail[] = READINESS_QUESTIONS.map((q) => {
    const raw = answers[q.id];
    const maxPoints = q.multiSelect
      ? q.options.reduce((sum, o) => sum + o.points, 0)
      : Math.max(...q.options.map((o) => o.points));
    let points = 0;
    let selectedLabels: string[] = [];

    if (q.multiSelect) {
      const selected = (Array.isArray(raw) ? raw : []).map((v) =>
        q.options.find((o) => o.value === v)
      );
      selectedLabels = selected
        .map((o) => o?.label)
        .filter((l): l is string => Boolean(l));
      points = selected.reduce((sum, o) => sum + (o?.points ?? 0), 0);
      if (selected.length === 0) points = 10;
      points = Math.min(points, maxPoints);
    } else {
      const selected = q.options.find((o) => o.value === raw);
      points = selected?.points ?? 0;
      selectedLabels = selected ? [selected.label] : [];
    }

    scores.set(q.id, points);
    return {
      questionId: q.id,
      question: q.title,
      answer: selectedLabels.length ? selectedLabels.join(", ") : "None selected",
      points,
      maxPoints,
    };
  });

  let weightedTotal = 0;
  for (const q of scored) {
    weightedTotal += (scores.get(q.id) ?? 0) * READINESS_WEIGHTS[q.id];
  }
  const score = Math.round(weightedTotal);

  const categories: CategoryScore[] = (Object.keys(CATEGORY_LABELS) as ReadinessCategoryId[]).map(
    (id) => {
      const catScored = scored.filter((q) => q.category === id);
      let weighted = 0;
      let weightSum = 0;
      let points = 0;
      for (const q of catScored) {
        const s = scores.get(q.id) ?? 0;
        points += s;
        weighted += s * READINESS_WEIGHTS[q.id];
        weightSum += READINESS_WEIGHTS[q.id];
      }
      return {
        id,
        label: CATEGORY_LABELS[id],
        points,
        maxPoints: catScored.length * 100,
        pct: weightSum > 0 ? Math.round(weighted / weightSum) : 0,
      };
    }
  );

  const priorityAreas: PriorityArea[] = [...scored]
    .map((q) => ({
      questionId: q.id,
      label: READINESS_LABELS[q.id],
      pct: scores.get(q.id) ?? 0,
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2);

  const verdict = verdictFor(score);
  return {
    score,
    label: verdict.label,
    tagline: verdict.tagline,
    categories,
    details,
    priorityAreas,
  };
}

export function verdictFor(score: number): { label: string; tagline: string } {
  if (score >= 80) {
    return {
      label: "Application Ready",
      tagline:
        "You're strong across the board. Focus on execution — documents, deadlines and polished applications.",
    };
  }
  if (score >= 60) {
    return {
      label: "Almost Ready",
      tagline:
        "You have a solid foundation. Close one or two gaps and you'll be in a competitive position.",
    };
  }
  if (score >= 40) {
    return {
      label: "Building Readiness",
      tagline:
        "There are meaningful gaps, but a structured plan will get you where you need to be.",
    };
  }
  return {
    label: "Early Stage",
    tagline:
      "You're at the start of your journey. Foundational work comes first, and your path abroad is still very buildable.",
  };
}
