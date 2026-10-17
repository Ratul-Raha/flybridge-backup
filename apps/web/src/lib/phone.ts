export const BD_COUNTRY_CODE = "+880";

export function normalizeBdPhone(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  let cleaned = trimmed.replace(/[\s\-\(\)]/g, "");

  // +8801XXXXXXXXX (already full)
  if (/^\+8801\d{9}$/.test(cleaned)) return cleaned;

  // 8801XXXXXXXXX (no +)
  if (/^8801\d{9}$/.test(cleaned)) return "+" + cleaned;

  // 01XXXXXXXXX (local)
  if (/^01\d{9}$/.test(cleaned)) return BD_COUNTRY_CODE + cleaned.slice(1);

  // 1XXXXXXXXX (just the national number)
  if (/^1\d{9}$/.test(cleaned)) return BD_COUNTRY_CODE + cleaned;

  return cleaned;
}

export function isValidBdPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizeBdPhone(phone);
  return /^\+8801\d{9}$/.test(normalized);
}

export function formatBdPhoneForDisplay(phone: string): string {
  const normalized = normalizeBdPhone(phone);
  if (!isValidBdPhone(normalized)) return phone;
  return normalized.replace(/^(\+880)(1\d{9})$/, "$1 $2");
}
