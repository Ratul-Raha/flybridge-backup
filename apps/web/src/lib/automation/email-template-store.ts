import "server-only";

import { connectDb } from "@/lib/db";
import { EmailTemplateOverride } from "@/lib/models/email-template";
import { EMAIL_TEMPLATES, emailTemplateById, type EmailTemplate } from "./email-templates";

export type ResolvedEmailTemplate = {
  subject: string;
  body: string;
  custom: boolean;
  updatedAt?: string;
};

export type EmailTemplateOverrideInput = {
  subject: string;
  body: string;
};

/** Fetch all saved overrides keyed by template id. */
export async function loadEmailTemplateOverrides(): Promise<Record<string, EmailTemplateOverrideInput>> {
  try {
    await connectDb();
    const docs = await EmailTemplateOverride.find().select("templateId subject body").lean();
    const map: Record<string, EmailTemplateOverrideInput> = {};
    for (const d of docs) {
      map[d.templateId] = { subject: d.subject ?? "", body: d.body ?? "" };
    }
    return map;
  } catch (error) {
    console.error("[email-templates] failed to load overrides:", error);
    return {};
  }
}

/** Built-in templates with any saved admin overrides applied. */
export async function mergedTemplates(): Promise<EmailTemplate[]> {
  const overrides = await loadEmailTemplateOverrides();
  return EMAIL_TEMPLATES.map((t) => {
    const o = overrides[t.id];
    if (!o || (!o.subject && !o.body)) return t;
    return { ...t, subject: o.subject || t.subject, body: o.body || t.body };
  });
}

/** Resolve the effective template (subject + body) for a single template id. */
export async function resolveEmailTemplate(
  templateId: string
): Promise<{ subject: string; body: string } | undefined> {
  const builtin = emailTemplateById(templateId);
  if (!builtin) return undefined;
  try {
    await connectDb();
    const override = await EmailTemplateOverride.findOne({ templateId }).select("subject body").lean();
    if (!override || (!override.subject && !override.body)) {
      return { subject: builtin.subject, body: builtin.body };
    }
    return {
      subject: override.subject || builtin.subject,
      body: override.body || builtin.body,
    };
  } catch (error) {
    console.error("[email-templates] failed to resolve override:", error);
    return { subject: builtin.subject, body: builtin.body };
  }
}

export async function saveEmailTemplateOverride(
  templateId: string,
  input: EmailTemplateOverrideInput,
  userId: string | undefined
): Promise<{ ok: boolean; error?: string }> {
  if (!emailTemplateById(templateId)) {
    return { ok: false, error: "Unknown template" };
  }
  if (typeof input.subject !== "string" || typeof input.body !== "string") {
    return { ok: false, error: "subject and body are required" };
  }
  if (!input.subject.trim() || !input.body.trim()) {
    return { ok: false, error: "Subject and body cannot be empty" };
  }
  await connectDb();
  await EmailTemplateOverride.findOneAndUpdate(
    { templateId },
    { $set: { subject: input.subject, body: input.body, updatedBy: userId } },
    { upsert: true }
  );
  return { ok: true };
}

export async function resetEmailTemplateOverride(templateId: string): Promise<{ ok: boolean; error?: string }> {
  if (!emailTemplateById(templateId)) {
    return { ok: false, error: "Unknown template" };
  }
  await connectDb();
  await EmailTemplateOverride.deleteOne({ templateId });
  return { ok: true };
}