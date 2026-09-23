import type { Metadata } from "next";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { ReadinessWizard } from "@/components/readiness/readiness-wizard";

export const metadata: Metadata = {
  title: "Study Abroad Readiness Assessment | FlyBridge Education Group",
  description:
    "Evaluate your study abroad readiness with our comprehensive assessment. Get a personalized score and AI-powered action plan covering academics, finances, and visa preparedness.",
};

export default function ReadinessPage() {
  return (
    <main className="relative">
      <Nav />
      <section className="relative overflow-hidden pt-[clamp(96px,14vh,150px)] pb-16 px-0 sm:px-[clamp(20px,4.5vw,56px)]">
        {/* Watermark background layer (full bleed) */}
        <div className="absolute inset-0 -z-20" aria-hidden="true">
          <Image
            src="/watermark.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Readability / brand tint overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(246,248,252,0.9) 0%, rgba(246,248,252,0.82) 35%, rgba(246,248,252,0.9) 70%, rgba(246,248,252,0.97) 100%)",
            }}
          />
          {/* Soft green + blue glow for energy */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 700px 420px at 85% 2%, rgba(15,169,104,0.10), transparent 60%), radial-gradient(ellipse 560px 380px at 4% 96%, rgba(47,95,224,0.08), transparent 62%)",
            }}
          />
          {/* Fine grid for texture */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "linear-gradient(rgba(18,32,67,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.035) 1px, transparent 1px)",
              backgroundSize: "48px 48px, 48px 48px",
            }}
          />
        </div>

        {/* Floating glow orbs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl sm:opacity-20"
          aria-hidden="true"
          style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl"
          aria-hidden="true"
          style={{ background: "radial-gradient(circle, #2F5FE0, transparent 70%)" }}
        />

        <div className="relative z-10 w-full">
          <ReadinessWizard />
        </div>
      </section>
    </main>
  );
}
