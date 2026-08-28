import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { ScholarshipsHero } from "@/components/scholarships/scholarships-hero";
import { PublicScholarshipList } from "@/components/scholarships/public-scholarship-list";

export const metadata: Metadata = {
  title: "Scholarships | FlyBridge Education Group",
  description:
    "Real scholarships from universities and institutions around the world — amounts, deadlines and who can apply. Full details for members.",
};

export default function ScholarshipsPage() {
  return (
    <>
      <Nav />
      <main>
        <ScholarshipsHero />

        <section className="px-[clamp(20px,4.5vw,56px)] pt-[54px] pb-[110px]">
          <div className="w-full max-w-[1320px] mx-auto">
            <PublicScholarshipList />
          </div>
        </section>
      </main>
    </>
  );
}