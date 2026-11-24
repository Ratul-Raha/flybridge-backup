import { redirectToProgram } from "@/lib/redirect-to-program";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function IeltsReadingRedirect({ searchParams }: Props) {
  redirectToProgram("easy-smart-ielts-reading", searchParams);
}
