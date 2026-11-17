import { isValidPhone } from "./phone.ts";
import { isStaffRole, type AccountType } from "./roles.ts";

/**
 * Staff accounts (admins and moderators) are exempt from the phone requirement.
 * Every other signed-in user must have a valid phone number.
 */
export function requiresPhone(
  role: AccountType,
  phone: string | null | undefined
): boolean {
  if (isStaffRole(role)) return false;
  return !isValidPhone(phone ?? "");
}
