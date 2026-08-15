import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { ReadinessWizard } from "@/components/readiness/readiness-wizard";

export const metadata: Metadata = {
  title: "Study Abroad Readiness Score | FlyBridge Education Group",
  description:
    "Answer 10 quick questions and get your personalized study abroad readiness score — plus an AI-built action plan to boost your chances.",
};

export default function ReadinessPage() {
  return (
    <main>
      <Nav />
      <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(120px,16vh,170px)] pb-24">
        <ReadinessWizard />
      </section>
    </main>
  );
}