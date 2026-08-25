import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { PublicResourceList } from "@/components/resources/public-resource-list";

export const metadata: Metadata = {
  title: "Resources | FlyBridge Education Group",
  description:
    "Free guides, checklists, templates and tools to help you plan your studies, work permit and career abroad — download instantly.",
};

export default function ResourcesPage() {
  return (
    <main>
      <Nav />
      <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(120px,16vh,170px)] pb-24">
        <div className="w-full max-w-[1320px] mx-auto">
          <div className="max-w-[680px]">
            <span className="font-mono text-[10px] tracking-[2px] uppercase" style={{ color: "var(--brand)" }}>
              Resource library
            </span>
            <h1
              className="font-display text-[clamp(30px,5vw,46px)] font-semibold tracking-[-0.03em] mt-3 leading-[1.05]"
              style={{ color: "var(--ink)" }}
            >
              Guides, templates &amp; tools for every step abroad
            </h1>
            <p className="text-[15px] leading-[1.7] mt-4 max-w-[540px]" style={{ color: "var(--body)" }}>
              Free and members-only documents, checklists, videos and links — covering
              visas, applications, interviews and more. Browse by topic or search, then
              download in one click.
            </p>
          </div>
          <div className="mt-12">
            <PublicResourceList />
          </div>
        </div>
      </section>
    </main>
  );
}
