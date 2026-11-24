import { redirectToProgram } from "@/lib/redirect-to-program";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function IeltsBandScoreRedirect({ searchParams }: Props) {
  redirectToProgram("ielts-band-score-machine", searchParams);
}
