import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Resource } from "@/lib/models/resource";
import { ResourceDownload } from "@/lib/models/resource-download";
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

    const [ownCount, topRows] = await Promise.all([
      ResourceDownload.countDocuments({ resource: resource._id }),
      ResourceDownload.aggregate<{ count: number }>([
        { $group: { _id: "$resource", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);
    const topCount = topRows[0]?.count ?? 0;
    const mostDownloaded = ownCount > 0 && ownCount === topCount;

    return (
      <main>
        <Nav />
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,150px)] pb-24">
          <div className="w-full max-w-[1080px] mx-auto">
            <ResourceDetail
              wantsDownload={searchParams.download === "1"}
              wantsGet={searchParams.get === "1"}
              mostDownloaded={mostDownloaded}
              resource={{
                id: resource._id.toString(),
                title: resource.title,
                description: resource.description ?? "",
                category: resource.category,
                fileType: resource.fileType,
                fileUrl: resource.fileUrl,
                fileName: resource.fileName ?? null,
                fileSize: resource.fileSize ?? 0,
                thumbnail: resource.thumbnail ?? null,
                releaseDate: resource.releaseDate.toISOString(),
                access: resource.access,
                price: resource.price ?? 0,
                featured: resource.featured ?? false,
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
