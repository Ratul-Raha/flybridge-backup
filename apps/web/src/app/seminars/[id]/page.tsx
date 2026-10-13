import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { cleanPrices } from "@/lib/pricing";
import { Nav } from "@/components/nav";
import { SeminarDetail } from "@/components/seminars/seminar-detail";
import { MetaProductView } from "@/components/meta-product-view";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const seminar = await Seminar.findById(params.id);
    if (!seminar) return {};
    const title = `${seminar.title} | FlyBridge Education Group`;
    const description = seminar.description ?? undefined;
    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        url: `/seminars/${seminar._id.toString()}`,
        images: seminar.image ? [{ url: seminar.image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: seminar.image ? [seminar.image] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function SeminarDetailPage({ params }: Params) {
  try {
    await connectDb();
    const seminar = await Seminar.findById(params.id);
    if (!seminar) notFound();

    const registrations = await SeminarRegistration.countDocuments({
      seminar: seminar._id,
    });

    const session = await readSession();
    const isManager =
      session?.role === "admin" || session?.role === "moderator";
    let hasAccessToUrl = isManager;
    if (!hasAccessToUrl && session?.email) {
      const registration = await SeminarRegistration.findOne({
        seminar: seminar._id,
        email: session.email.toLowerCase(),
      });
      hasAccessToUrl = !!registration;
    }

    return (
      <main>
        <MetaProductView
          contentId={seminar._id.toString()}
          contentName={seminar.title}
          value={seminar.prices?.BDT ?? seminar.price ?? undefined}
          currency={seminar.prices?.BDT != null ? "BDT" : "USD"}
        />
        <Nav />
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,150px)] pb-24">
          <div className="w-full max-w-[980px] mx-auto">
            <SeminarDetail
              seminar={{
                id: seminar._id.toString(),
                title: seminar.title,
                description: seminar.description ?? "",
                dateTime: seminar.dateTime.toISOString(),
                image: seminar.image ?? null,
                type: seminar.type,
                price: seminar.price ?? 0,
                prices: cleanPrices(seminar.prices),
                url: hasAccessToUrl ? (seminar.url ?? null) : null,
                duration: seminar.duration ?? null,
                registrations,
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
