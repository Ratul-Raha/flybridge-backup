import { BRAND, EMERALD, ROSE, SKY, AMBER } from "@/components/dashboard/reports/lib";

const SOURCE_META: Record<string, { label: string; color: string; bg: string }> = {
  email: { label: "Email", color: BRAND, bg: "rgba(110,76,255,0.1)" },
  meta: { label: "Facebook / Instagram", color: "#1877F2", bg: "rgba(24,119,242,0.1)" },
  google: { label: "Google", color: "#EA4335", bg: "rgba(234,67,53,0.1)" },
  referral: { label: "Referral", color: SKY, bg: "rgba(14,165,233,0.1)" },
  direct: { label: "Direct", color: EMERALD, bg: "rgba(16,185,129,0.1)" },
  unknown: { label: "Unknown", color: AMBER, bg: "rgba(245,158,11,0.12)" },
};

export function sourceLabel(source: string): string {
  const key = (source || "").toLowerCase();
  const meta = SOURCE_META[key];
  if (meta) return meta.label;
  if (!key) return "Direct";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function sourceStyle(source: string): { color: string; bg: string } {
  const key = (source || "").toLowerCase();
  const meta = SOURCE_META[key];
  if (meta) return { color: meta.color, bg: meta.bg };
  return { color: ROSE, bg: "rgba(244,63,94,0.1)" };
}
