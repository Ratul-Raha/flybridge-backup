import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db";
import { LeadField } from "@/lib/models/lead-field";
import { findLeadListByFormSlug } from "@/lib/leads";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share your details | FlyBridge Education Group",
  description: "Submit your details and our team will get back to you.",
  robots: { index: false, follow: false },
};

export default async function PublicLeadFormPage({ params }: { params: { slug: string } }) {
  const list = await findLeadListByFormSlug(params.slug);
  if (!list || list.formEnabled === false) notFound();

  await connectDb();
  const fields = await LeadField.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();

  return (
    <PublicLeadForm
      slug={list.formSlug || list._id.toString()}
      listName={list.name}
      description={list.description ?? ""}
      fields={fields.map((field) => ({
        id: field._id.toString(),
        name: field.name,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder ?? "",
        options: (field.options ?? []).map((o) => ({
          value: o.value ?? "",
          label: o.label ?? o.value ?? "",
        })),
        isRequired: Boolean(field.isRequired),
      }))}
    />
  );
}
