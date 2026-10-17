import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ResourceComment } from "@/lib/models/resource-comment";
import { ResourceLove } from "@/lib/models/resource-love";
import { cleanPrices } from "@/lib/pricing";
import { Nav } from "@/components/nav";
import { ResourceDetail } from "@/components/resources/resource-detail";

type Params = { params: { id: string }; searchParams: { download?: string; get?: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const resource = await Resource.findById(params.id);
    if (!resource) return {};
    const title = `${resource.title} | FlyBridge Education Group`;
    const description = resource.description ?? undefined;
    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        url: `/resources/${resource._id.toString()}`,
        images: resource.thumbnail ? [{ url: resource.thumbnail }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: resource.thumbnail ? [resource.thumbnail] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function ResourceDetailPage({ params, searchParams }: Params) {
  try {
    await connectDb();
    const resource = await Resource.findById(params.id);
    if (!resource) notFound();

    const session = await readSession();

    const [ownCount, topRows, commentCount, loveCount] = await Promise.all([
      ResourceDownload.countDocuments({ resource: resource._id }),
      ResourceDownload.aggregate<{ count: number }>([
        { $group: { _id: "$resource", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      ResourceComment.countDocuments({ resource: resource._id }),
      ResourceLove.countDocuments({ resource: resource._id }),
    ]);
    const topCount = topRows[0]?.count ?? 0;
    const mostDownloaded = ownCount > 0 && ownCount === topCount;

    const lovedByMe = session?.userId
      ? Boolean(await ResourceLove.exists({ resource: resource._id, user: session.userId }))
      : false;

    const isManager =
      session?.role === "admin" || session?.role === "moderator";
    const includeUrl = isManager || resource.access === "public";

    return (
      <main>
        <Nav />
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,150px)] pb-24">
          <div className="w-full max-w-[1080px] mx-auto">
            <ResourceDetail
              wantsDownload={searchParams.download === "1"}
              wantsGet={searchParams.get === "1"}
              mostDownloaded={mostDownloaded}
              commentCount={commentCount}
              loveCount={loveCount}
              lovedByMe={lovedByMe}
              resource={{
                id: resource._id.toString(),
                title: resource.title,
                description: resource.description ?? "",
                category: resource.category,
                fileType: resource.fileType,
                fileUrl: includeUrl ? resource.fileUrl : "",
                fileName: resource.fileName ?? null,
                fileSize: resource.fileSize ?? 0,
                thumbnail: resource.thumbnail ?? null,
                releaseDate: resource.releaseDate.toISOString(),
                access: resource.access,
                price: resource.price ?? 0,
                prices: cleanPrices(resource.prices),
                featured: resource.featured ?? false,
                viewCount: resource.viewCount ?? 0,
              }}
            />
          </div>
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}
