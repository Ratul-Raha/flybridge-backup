import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";
import { MockTest } from "@/lib/models/mock-test";
import { Nav } from "@/components/nav";
import { MockTestBundleDetail } from "@/components/mock-tests/bundle-detail";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const bundle = await MockTestBundle.findById(params.id);
    if (!bundle) return {};
    const title = `${bundle.title} | FlyBridge IELTS Mock Tests`;
    return {
      title,
      description: bundle.description ?? undefined,
      openGraph: {
        type: "article",
        title,
        description: bundle.description ?? undefined,
        url: `/mock-tests/${bundle._id.toString()}`,
        images: bundle.image ? [{ url: bundle.image }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function MockTestBundlePage({ params }: Params) {
  try {
    await connectDb();
    const bundle = await MockTestBundle.findById(params.id);
    if (!bundle) notFound();

    const session = await readSession();
    const isManager = session?.role === "admin" || session?.role === "moderator";
    if (!isManager) redirect("/");

    const testCount = await MockTest.countDocuments({ bundle: bundle._id });

    return (
      <main>
        <Nav />
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,150px)] pb-24">
          <div className="w-full max-w-[1040px] mx-auto">
            <MockTestBundleDetail
              bundle={{
                id: bundle._id.toString(),
                title: bundle.title,
                description: bundle.description ?? "",
                badge: bundle.badge ?? "",
                image: bundle.image ?? null,
                price: bundle.price ?? 0,
                currency: bundle.currency ?? "USD",
                featured: bundle.featured ?? false,
                testCount,
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