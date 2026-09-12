import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { PublicMockTests } from "@/components/mock-tests/public-mock-tests";

export const metadata: Metadata = {
  title: "IELTS Mock Tests | FlyBridge Education Group",
  description:
    "Real IELTS Reading, Listening, Writing and Speaking mock tests graded by AI with band-score feedback. Practice anytime with unlimited attempts.",
};

export default function MockTestsPage() {
  return (
    <>
      <Nav />
      <PublicMockTests />
    </>
  );
}