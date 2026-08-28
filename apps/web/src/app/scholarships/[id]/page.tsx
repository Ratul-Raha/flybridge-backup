import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { Scholarship } from "@/lib/models/scholarship";
import { readSession } from "@/lib/auth/session";
import { Nav } from "@/components/nav";
import { PublicScholarshipDetail } from "@/components/scholarships/public-scholarship-detail";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const scholarship = await Scholarship.findOne({ _id: params.id, active: true });
    if (!scholarship) return {};
    const teaser = [
      scholarship.institution,
      scholarship.amount && `Amount · ${scholarship.amount}`,
      scholarship.deadline && `Apply by ${scholarship.deadline}`,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      title: `${scholarship.title || scholarship.institution} | FlyBridge Education Group`,
      description: teaser || undefined,
    };
  } catch {
    return {};
  }
}

export default async function ScholarshipDetailPage({ params }: Params) {
  try {
    await connectDb();
    const scholarship = await Scholarship.findOne({ _id: params.id, active: true });
    if (!scholarship) notFound();

    const session = await readSession();
    if (session?.userId) redirect("/dashboard/scholarships");

    return (
      <main>
        <Nav />
        <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,150px)] pb-24">
          <div className="w-full max-w-[980px] mx-auto">
            <PublicScholarshipDetail
              scholarship={{
                id: scholarship._id.toString(),
                institution: scholarship.institution,
                title: scholarship.title ?? "",
                country: scholarship.country ?? "",
                countryCode: scholarship.countryCode ?? "",
                level: scholarship.level,
                amount: scholarship.amount ?? "",
                deadline: scholarship.deadline ?? "",
                imageUrl: scholarship.imageUrl ?? "",
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