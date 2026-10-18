import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { PublicBlogList } from "@/components/blogs/public-blog-list";

export const metadata: Metadata = {
  title: "Blog | FlyBridge Education Group",
  description:
    "Guides and insights on studying, working and building a career abroad — visas, scholarships, English, career tips and student life.",
};

export const revalidate = 300;

export default async function BlogsPage() {
  return (
    <main>
      <Nav />
      <PublicBlogList />
    </main>
  );
}