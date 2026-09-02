import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { PartnersStrip } from "@/components/partners-strip";
import { SuccessStories } from "@/components/success-stories";
import { Programs } from "@/components/programs";
import { PublicLeaderboard } from "@/components/public-leaderboard";
import { PromoPopup } from "@/components/promo-popup";
import { ScholarshipTicker } from "@/components/dashboard/scholarship-ticker";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Nav />
      <ScholarshipTicker href="/scholarships" />
      <main>
        <Hero />
        <PartnersStrip />
        <Programs />
        <PublicLeaderboard />
        <SuccessStories />
      </main>
      <PromoPopup />
    </>
  );
}
