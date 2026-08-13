import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { Nav } from "@/components/nav";
import { SeminarDetail } from "@/components/seminars/seminar-detail";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const seminar = await Seminar.findById(params.id);
    if (!seminar) return {};
    return {
      title: `${seminar.title} | FlyBridge Education Group`,
      description: seminar.description ?? undefined,
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

    return (
      <main>
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
                url: seminar.url ?? null,
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