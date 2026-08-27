import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { SeminarsHero } from "@/components/seminars/seminars-hero";
import { SeminarList } from "@/components/seminars/seminar-list";

export const metadata: Metadata = {
  title: "Seminars | FlyBridge Education Group",
  description:
    "Free live FlyBridge seminars on studying abroad, work permits and career guidance — plus recaps of recent sessions.",
};

export default function SeminarsPage() {
  return (
    <>
      <Nav />
      <main>
        <SeminarsHero />

        <section className="px-[clamp(20px,4.5vw,56px)] pt-[70px] pb-[110px]">
          <div className="w-full max-w-[1320px] mx-auto">
            <SeminarList />
          </div>
        </section>
      </main>
    </>
  );
}