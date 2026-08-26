import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { ReadinessWizard } from "@/components/readiness/readiness-wizard";

export const metadata: Metadata = {
  title: "Study Abroad Readiness Assessment | FlyBridge Education Group",
  description:
    "Evaluate your study abroad readiness with our comprehensive assessment. Get a personalized score and AI-powered action plan covering academics, finances, and visa preparedness.",
};

export default function ReadinessPage() {
  return (
    <main>
      <Nav />
      <section
        className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(120px,16vh,170px)] pb-24"
        style={{
          background:
            "linear-gradient(rgba(18,32,67,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.045) 1px, transparent 1px), radial-gradient(700px 420px at 88% 8%, rgba(15,169,104,0.06), transparent 60%)",
          backgroundSize: "40px 40px, 40px 40px, auto",
        }}
      >
        <ReadinessWizard />
      </section>
    </main>
  );
}