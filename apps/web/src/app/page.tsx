import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Programs } from "@/components/programs";
import { PromoPopup } from "@/components/promo-popup";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Programs />
      </main>
      <PromoPopup />
    </>
  );
}
