import "server-only";

import type { ChartData } from "@/lib/chart-data";
import type { QuizQuestion } from "@/lib/ai/quiz";
import { judgeObjectiveAnswers, judgeWrittenAnswers } from "@/lib/ai/quiz-judge";
import type { PracticeSetContent } from "./schema";

const CHOICE_TYPES = new Set([
  "multiple-choice",
  "true-false-ng",
  "true-false-not-given",
  "yes-no-not-given",
  "heading-matching",
  "matching-headings",
  "matching-features",
  "matching-information",
  "matching-sentence-endings",
  "matching",
  "mcq",
]);

const SUBJECTIVE_TYPES = new Set([
  "written",
  "task-1",
  "task-2",
  "part-1",
  "part-2",
  "part-3",
]);

export type PracticeGradeResult = {
  questionId: string;
  correct: boolean | null;
  correctAnswer: string;
  explanation: string;
  bandScore: number;
  feedback: string;
  exampleAnswer: string;
  comparison: string;
  band7Answer: string;
};

export type PracticeGradeSummary = {
  mode: "objective" | "subjective" | "mixed";
  score: number;
  correctCount: number;
  objectiveCount: number;
  overallBand: number;
  results: PracticeGradeResult[];
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function keywords(value: string): Set<string> {
  const stop = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "between",
    "through", "during", "before", "after", "above", "below", "and",
    "but", "or", "nor", "not", "so", "yet", "both", "either", "neither",
    "each", "every", "all", "any", "few", "more", "most", "other",
    "some", "such", "no", "only", "own", "same", "than", "too", "very",
    "just", "because", "if", "when", "that", "this", "it", "its", "i",
    "me", "my", "we", "our", "you", "your", "they", "them", "their",
    "what", "which", "who", "whom",
  ]);
  return new Set(
    normalize(value)
      .split(" ")
      .filter((word) => word.length > 2 && !stop.has(word))
  );
}

function gradeShortAnswer(userAnswer: string, referenceAnswer: string): boolean {
  const user = normalize(userAnswer);
  const reference = normalize(referenceAnswer);
  if (!user) return false;
  if (user === reference) return true;
  if (user.includes(reference) || reference.includes(user)) return true;

  const userWords = keywords(user);
  const referenceWords = keywords(reference);
  if (userWords.size === 0 || referenceWords.size === 0) return false;

  let overlap = 0;
  for (const word of userWords) {
    if (referenceWords.has(word)) overlap++;
  }
  return overlap / Math.max(userWords.size, referenceWords.size) >= 0.5;
}

function toQuizQuestion(question: PracticeSetContent["questions"][number]): QuizQuestion {
  const type: QuizQuestion["type"] = CHOICE_TYPES.has(question.type)
    ? "mcq"
    : SUBJECTIVE_TYPES.has(question.type)
      ? "written"
      : "short-answer";
  const chart = question.chart;
  return {
    id: question.id,
    type,
    question: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer ?? "",
    explanation: question.explanation ?? "",
    ...(chart && typeof chart === "object" && !Array.isArray(chart)
      ? { chart: chart as ChartData }
      : {}),
  };
}

export async function gradePracticeSet(
  content: PracticeSetContent,
  skill: string,
  answers: { questionId: string; answer: string }[],
  provider?: string | null
): Promise<PracticeGradeSummary> {
  const answerMap = new Map(answers.map((entry) => [entry.questionId, entry.answer]));
  const answersByQuestion = Object.fromEntries(answerMap.entries());

  const objectiveQuestions = content.questions.filter(
    (question) => !SUBJECTIVE_TYPES.has(question.type) && Boolean(question.correctAnswer)
  );
  const subjectiveQuestions = content.questions.filter(
    (question) => SUBJECTIVE_TYPES.has(question.type) || !question.correctAnswer
  );

  const results: PracticeGradeResult[] = content.questions.map((question) => {
    const userAnswer = answerMap.get(question.id) ?? "";
    const isSubjective = SUBJECTIVE_TYPES.has(question.type) || !question.correctAnswer;
    const correctAnswer = question.correctAnswer ?? "";

    if (isSubjective) {
      return {
        questionId: question.id,
        correct: null,
        correctAnswer: "",
        explanation: question.explanation ?? "",
        bandScore: 0,
        feedback: "",
        exampleAnswer: "",
        comparison: "",
        band7Answer: "",
      };
    }

    const accepted = Array.from(new Set([correctAnswer, ...(question.acceptedAnswers ?? [])])).filter(
      Boolean
    );
    const correct = CHOICE_TYPES.has(question.type)
      ? normalize(userAnswer) === normalize(correctAnswer)
      : accepted.some((answer) => gradeShortAnswer(userAnswer, answer));

    return {
      questionId: question.id,
      correct,
      correctAnswer: accepted.join(" / ") || correctAnswer,
      explanation: question.explanation ?? "",
      bandScore: 0,
      feedback: "",
      exampleAnswer: "",
      comparison: "",
      band7Answer: "",
    };
  });

  if (subjectiveQuestions.length > 0) {
    try {
      const feedback = await judgeWrittenAnswers(
        subjectiveQuestions.map(toQuizQuestion),
        answersByQuestion,
        skill,
        provider
      );
      const feedbackMap = new Map(feedback.map((entry) => [entry.questionId, entry]));
      for (const result of results) {
        const entry = feedbackMap.get(result.questionId);
        if (!entry) continue;
        result.bandScore = entry.bandScore;
        result.feedback = entry.feedback;
        result.exampleAnswer = entry.exampleAnswer;
        result.comparison = entry.comparison;
      }
    } catch (error) {
      console.error("practice written judge error", error);
      for (const result of results) {
        if (result.correct === null) {
          result.feedback = "AI feedback is unavailable right now. Try again later.";
        }
      }
    }
  }

  if ((skill === "reading" || skill === "listening") && objectiveQuestions.length > 0) {
    try {
      const feedback = await judgeObjectiveAnswers(
        objectiveQuestions.map(toQuizQuestion),
        answersByQuestion,
        skill,
        provider
      );
      const feedbackMap = new Map(feedback.map((entry) => [entry.questionId, entry]));
      for (const result of results) {
        const entry = feedbackMap.get(result.questionId);
        if (!entry) continue;
        result.explanation = entry.explanation || result.explanation;
        result.band7Answer = entry.band7Answer;
        result.comparison = entry.comparison;
      }
    } catch (error) {
      console.error("practice objective judge error", error);
    }
  }

  const correctCount = results.filter((result) => result.correct === true).length;
  const objectiveCount = objectiveQuestions.length;
  const score =
    objectiveCount > 0 ? Math.round((correctCount / objectiveCount) * 100) : 0;
  const bands = results
    .map((result) => result.bandScore)
    .filter((band) => band > 0);
  const overallBand =
    bands.length > 0
      ? Math.round((bands.reduce((sum, band) => sum + band, 0) / bands.length) * 2) / 2
      : 0;

  return {
    mode: subjectiveQuestions.length === 0
      ? "objective"
      : objectiveQuestions.length === 0
        ? "subjective"
        : "mixed",
    score,
    correctCount,
    objectiveCount,
    overallBand,
    results,
  };
}
