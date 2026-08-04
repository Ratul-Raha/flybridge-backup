import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { SeminarList } from "@/components/seminars/seminar-list";

export const metadata: Metadata = {
  title: "Seminars | FlyBridge Education Group",
  description:
    "Upcoming FlyBridge seminars — study abroad insights, work permits and career guidance.",
};

export default function SeminarsPage() {
  return (
    <main>
      <Nav />
      <section
        className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(120px,16vh,170px)] pb-20"
      >
        <div className="w-full max-w-[1320px] mx-auto">
          <span
            className="font-mono text-[10px] tracking-[2px] uppercase"
            style={{ color: "var(--brand)" }}
          >
            Live events · Upcoming
          </span>
          <h1
            className="font-display text-[clamp(30px,5vw,46px)] font-semibold tracking-[-0.03em] mt-3 max-w-[640px] leading-[1.05]"
            style={{ color: "var(--ink)" }}
          >
            Book your spot at our next seminar
          </h1>
          <p
            className="text-[15px] leading-[1.7] mt-4 max-w-[520px]"
            style={{ color: "var(--body)" }}
          >
            Join live online sessions on studying, working and building a career
            abroad. Registration is free — and creates your FlyBridge account.
          </p>
          <div className="mt-10">
            <SeminarList />
          </div>
        </div>
      </section>
    </main>
  );
}