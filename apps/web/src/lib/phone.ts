import { DIAL_CODES, type DialCode } from "./dial-codes";

export type { DialCode } from "./dial-codes";
export { DIAL_CODES } from "./dial-codes";

/** Default country when none can be inferred (Bangladesh, +880). */
export const DEFAULT_COUNTRY_ISO = "BD";

export function findCountryByIso(
  iso: string | null | undefined
): DialCode | undefined {
  if (!iso) return undefined;
  const upper = iso.toUpperCase();
  return DIAL_CODES.find((c) => c.code === upper);
}

export function getDefaultCountry(): DialCode {
  return (
    findCountryByIso(DEFAULT_COUNTRY_ISO) ??
    DIAL_CODES[0]
  );
}

/** Strip everything except a leading "+" and digits. */
export function normalizePhone(input: string): string {
  const cleaned = (input ?? "").replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return "";
  return "+" + digits;
}

/**
 * Split a stored phone number into its country and national part by matching
 * the longest known dial-code prefix.
 */
export function splitPhone(input: string): {
  country?: DialCode;
  national: string;
} {
  const digits = (input ?? "").replace(/\D/g, "");
  if (!digits) return { national: "" };

  const byLength = [...DIAL_CODES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of byLength) {
    if (digits.startsWith(country.dial)) {
      return { country, national: digits.slice(country.dial.length) };
    }
  }
  return { national: digits };
}

/** Build a normalized E.164 number from a dial code and national number. */
export function buildPhone(national: string, dial: string): string {
  const digits = (national ?? "").replace(/\D/g, "");
  const cleanDial = (dial ?? "").replace(/\D/g, "");
  if (!cleanDial || !digits) return "";
  return `+${cleanDial}${digits}`;
}

/** True when the value is a plausible E.164 number (7–15 digits total). */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+[1-9]\d{6,14}$/.test(normalized);
}

export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) return phone;
  const { country, national } = splitPhone(normalized);
  if (!country) return normalized;
  return `+${country.dial} ${national}`.trim();
}
