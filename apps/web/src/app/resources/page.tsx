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
      <PublicResourceList />
    </main>
  );
}