import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { ReadinessResultClient } from "@/components/readiness/readiness-result";

export const metadata: Metadata = {
  title: "Your Readiness Result | FlyBridge Education Group",
  description:
    "View your personalized study abroad readiness score, category breakdown and AI action plan.",
};

export default function ReadinessResultPage() {
  return (
    <main>
      <Nav />
      <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(120px,16vh,170px)] pb-24">
        <ReadinessResultClient />
      </section>
    </main>
  );
}