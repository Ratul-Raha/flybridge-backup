export type PublicScholarship = {
  id: string;
  institution: string;
  title: string;
  country: string;
  countryCode: string;
  level: string;
  amount: string;
  deadline: string;
  imageUrl: string;
};

export const LEVEL_LABELS: Record<string, string> = {
  any: "Any level",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
  postgraduate: "Postgraduate",
  school: "School",
};