import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { SuccessStories } from "@/components/success-stories";
import { Programs } from "@/components/programs";
import { PromoPopup } from "@/components/promo-popup";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SuccessStories />
        <Programs />
      </main>
      <PromoPopup />
    </>
  );
}
