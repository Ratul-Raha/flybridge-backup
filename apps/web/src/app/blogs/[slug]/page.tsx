import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Blog } from "@/lib/models/blog";
import { Nav } from "@/components/nav";
import { BlogDetail } from "@/components/blogs/blog-detail";

type Params = { params: { slug: string } };

export const revalidate = 300;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const blog = await Blog.findOne({ slug: params.slug, published: true });
    if (!blog) return {};
    const title = `${blog.title} | FlyBridge Education Group`;
    return {
      title,
      description: blog.excerpt ?? undefined,
      openGraph: {
        type: "article",
        title,
        description: blog.excerpt ?? undefined,
        url: `/blogs/${blog.slug}`,
        images: blog.cover ? [{ url: blog.cover }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: blog.excerpt ?? undefined,
        images: blog.cover ? [blog.cover] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogDetailPage({ params }: Params) {
  try {
    await connectDb();
    const blog = await Blog.findOne({ slug: params.slug, published: true });
    if (!blog) notFound();

    const related = await Blog.find({
      _id: { $ne: blog._id },
      published: true,
    })
      .sort({ publishedAt: -1 })
      .limit(4);

    // Increment view count lazily
    blog.viewCount = (blog.viewCount ?? 0) + 1;
    blog.save().catch(() => {});

    return (
      <main>
        <Nav />
        <BlogDetail
          blog={{
            id: blog._id.toString(),
            title: blog.title,
            slug: blog.slug,
            excerpt: blog.excerpt ?? "",
            content: blog.content ?? "",
            category: blog.category ?? "General",
            cover: blog.cover ?? null,
            author: blog.author ?? "FlyBridge",
            publishedAt: blog.publishedAt ? blog.publishedAt.toISOString() : null,
            viewCount: blog.viewCount ?? 0,
          }}
          related={related.map((r) => ({
            id: r._id.toString(),
            title: r.title,
            slug: r.slug,
            excerpt: r.excerpt ?? "",
            category: r.category ?? "General",
            cover: r.cover ?? null,
            author: r.author ?? "FlyBridge",
            featured: r.featured ?? false,
            publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
            viewCount: r.viewCount ?? 0,
          }))}
        />
      </main>
    );
  } catch {
    notFound();
  }
}