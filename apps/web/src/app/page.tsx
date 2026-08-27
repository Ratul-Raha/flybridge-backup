import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { PartnersStrip } from "@/components/partners-strip";
import { SuccessStories } from "@/components/success-stories";
import { Programs } from "@/components/programs";
import { PromoPopup } from "@/components/promo-popup";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PartnersStrip />
        <Programs />
        <SuccessStories />
      </main>
      <PromoPopup />
    </>
  );
}
