import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { Nav } from "@/components/nav";
import { PublicMockTests } from "@/components/mock-tests/public-mock-tests";

export const metadata: Metadata = {
  title: "IELTS Mock Tests | FlyBridge Education Group",
  description:
    "Real IELTS Reading, Listening, Writing and Speaking mock tests graded by AI with band-score feedback. Practice anytime with unlimited attempts.",
};

export default async function MockTestsPage() {
  const session = await readSession();
  const isManager = session?.role === "admin" || session?.role === "moderator";
  if (!isManager) redirect("/");

  return (
    <>
      <Nav />
      <PublicMockTests />
    </>
  );
}