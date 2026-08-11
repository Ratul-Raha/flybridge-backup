import { resolvePath } from "./conditions";

export function renderTemplate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = resolvePath(payload, path);
    if (value === undefined || value === null) return "";
    if (value instanceof Date) return value.toISOString();
    return String(value);
  });
}
