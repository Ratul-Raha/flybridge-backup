import dynamic from "next/dynamic";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { PartnersStrip } from "@/components/partners-strip";
import { SuccessStories } from "@/components/success-stories";
import { Programs } from "@/components/programs";
import { PublicLeaderboard } from "@/components/public-leaderboard";
import { getTotalUsers } from "@/lib/site-stats";

const IeltsLaunchTicker = dynamic(
  () =>
    import("@/components/ielts-launch-ticker").then(
      (m) => m.IeltsLaunchTicker
    ),
  { ssr: false, loading: () => null }
);

const IeltsPromoPopup = dynamic(
  () => import("@/components/ielts-promo-popup").then((m) => m.IeltsPromoPopup),
  { ssr: false, loading: () => null }
);

// Public landing content is fine to lag a few minutes; longer ISR windows mean
// far fewer regenerations (and far less Fast Origin Transfer) on a hot route.
export const revalidate = 300;

export default async function HomePage() {
  const totalUsers = await getTotalUsers();

  return (
    <>
      <Nav />
      <div className="pt-[74px] px-[clamp(20px,4.5vw,56px)]">
        <IeltsLaunchTicker />
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
