import { redirectToProgram } from "@/lib/redirect-to-program";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function SpokenEnglishRedirect({ searchParams }: Props) {
  redirectToProgram("easy-smart-spoken-english", searchParams);
}
