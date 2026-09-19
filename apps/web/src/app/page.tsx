import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { PartnersStrip } from "@/components/partners-strip";
import { SuccessStories } from "@/components/success-stories";
import { Programs } from "@/components/programs";
import { PublicLeaderboard } from "@/components/public-leaderboard";
import { ScholarshipTicker } from "@/components/dashboard/scholarship-ticker";
import { IeltsPromoPopup } from "@/components/ielts-promo-popup";
import { getTotalUsers } from "@/lib/site-stats";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const totalUsers = await getTotalUsers();

  return (
    <>
      <Nav />
      <div className="pt-[74px] px-[clamp(20px,4.5vw,56px)]">
        <ScholarshipTicker href="/scholarships" />
      </div>
      <main>
        <Hero userCount={totalUsers} />
        <PartnersStrip />
        <Programs />
        <PublicLeaderboard />
        <SuccessStories userCount={totalUsers} />
      </main>
      <IeltsPromoPopup />
    </>
  );
}
