import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Scholarship } from "@/lib/models/scholarship";
import { ScholarshipDetailView } from "@/components/dashboard/user/scholarship-detail";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    await connectDb();
    const scholarship = await Scholarship.findOne({ _id: params.id, active: true });
    if (!scholarship) return {};
    return {
      title: `${scholarship.title || scholarship.institution} | FlyBridge`,
    };
  } catch {
    return {};
  }
}

export default async function ScholarshipDetailPage({ params }: Params) {
  const session = await readSession();
  if (!session) redirect("/login");

  try {
    await connectDb();
    const s = await Scholarship.findOne({ _id: params.id, active: true });
    if (!s) notFound();

    return (
      <ScholarshipDetailView
        scholarship={{
          id: s._id.toString(),
          institution: s.institution,
          title: s.title ?? "",
          description: s.description ?? "",
          country: s.country ?? "",
          countryCode: s.countryCode ?? "",
          level: s.level,
          amount: s.amount ?? "",
          deadline: s.deadline ?? "",
          eligibility: s.eligibility ?? "",
          applyUrl: s.applyUrl ?? "",
          imageUrl: s.imageUrl ?? "",
        }}
      />
    );
  } catch {
    notFound();
  }
}