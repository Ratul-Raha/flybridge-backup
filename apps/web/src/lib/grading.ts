export type GradeResult = {
  percentage: number;
  grade: string;
  englishLevel: string;
  passed: boolean;
  totalQuizzes: number;
  completedQuizzes: number;
};

export function calculateGrade(quizScores: { score: number }[], totalLessons: number): GradeResult {
  const completedQuizzes = quizScores.length;
  const totalQuizzes = totalLessons;

  const percentage =
    completedQuizzes > 0
      ? Math.round(quizScores.reduce((sum, q) => sum + q.score, 0) / completedQuizzes)
      : 0;

  return {
    percentage,
    grade: getGradeLetter(percentage),
    englishLevel: getEnglishLevel(percentage),
    passed: percentage >= 60 && completedQuizzes === totalQuizzes,
    totalQuizzes,
    completedQuizzes,
  };
}

function getGradeLetter(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  return "F";
}

function getEnglishLevel(pct: number): string {
  if (pct >= 93) return "Advanced (C2)";
  if (pct >= 83) return "Upper-Intermediate (C1)";
  if (pct >= 73) return "Intermediate (B2)";
  if (pct >= 63) return "Lower-Intermediate (B1)";
  if (pct >= 50) return "Elementary (A2)";
  return "Beginner (A1)";
}
