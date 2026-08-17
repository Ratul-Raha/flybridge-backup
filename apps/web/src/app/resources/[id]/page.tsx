import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Resource } from "@/lib/models/resource";
import { Nav } from "@/components/nav";
import { ResourceDetail } from "@/components/resources/resource-detail";

type Params = { params: { id: string }; searchParams: { download?: string; get?: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const resource = await Resource.findById(params.id);
    if (!resource) return {};
    return {
      title: `${resource.title} | FlyBridge Education Group`,
      description: resource.description ?? undefined,
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

    return (
      <main>
        <Nav />
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,150px)] pb-24">
          <div className="w-full max-w-[980px] mx-auto">
            <ResourceDetail
              wantsDownload={searchParams.download === "1"}
              wantsGet={searchParams.get === "1"}
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
