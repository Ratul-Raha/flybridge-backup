import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Programs } from "@/components/programs";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Programs />
      </main>
    </>
  );
}
