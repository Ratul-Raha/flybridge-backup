import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { renderEmailTemplate, renderEmailSubject } from "@/lib/automation/render";
import { mergedTemplates } from "@/lib/automation/email-template-store";
import { EVENT_CATALOG } from "@/lib/events/catalog";
import { EmailTemplateBrowser, type TemplatePreview } from "@/components/dashboard/automations/email-template-browser";
import type { EventPayload } from "@/lib/events/types";

export const metadata: Metadata = {
  title: "Email Templates | FlyBridge",
};

function withoutMedia<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value),
    (key, val) => (/image$|thumbnail|hero/i.test(key) ? undefined : val)
  ) as T;
}

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/profile");

  const templates = await mergedTemplates();

  const previews: TemplatePreview[] = templates.map((t) => {
    const sample = t.events[0] ? EVENT_CATALOG[t.events[0]]?.samplePayload() : undefined;
    const payload = withoutMedia((sample ?? {}) as EventPayload) as Record<string, unknown>;
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      previewBody: t.previewBody,
      events: t.events,
      subject: renderEmailSubject(t.subject, payload),
      html: renderEmailTemplate(t.body, payload),
      subjectSource: t.subject,
      bodySource: t.body,
      samplePayload: payload,
    };
  });

  return <EmailTemplateBrowser templates={previews} initialTemplateId={searchParams.template} />;
}