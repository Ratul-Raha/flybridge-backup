import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { EMAIL_TEMPLATES } from "@/lib/automation/email-templates";
import { renderTemplate } from "@/lib/automation/template";
import { EVENT_CATALOG } from "@/lib/events/catalog";
import { EmailTemplateBrowser, type TemplatePreview } from "@/components/dashboard/automations/email-template-browser";

export const metadata: Metadata = {
  title: "Email Templates | FlyBridge",
};

function withoutMedia<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value),
    (key, val) => (/image$|thumbnail|hero/i.test(key) ? undefined : val)
  ) as T;
}

function buildPreviews(): TemplatePreview[] {
  return EMAIL_TEMPLATES.map((t) => {
    const sample = t.events[0] ? EVENT_CATALOG[t.events[0]]?.samplePayload() : undefined;
    const payload = withoutMedia(sample ?? {});
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      previewBody: t.previewBody,
      events: t.events,
      subject: renderTemplate(t.subject, payload),
      html: t.html(payload),
    };
  });
}

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const previews = buildPreviews();

  return <EmailTemplateBrowser templates={previews} initialTemplateId={searchParams.template} />;
}