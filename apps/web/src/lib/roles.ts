export type AccountType = "admin" | "moderator" | "user";

export type SubscriptionType = "free" | "paid";

export const ACCOUNT_TYPES: AccountType[] = ["admin", "moderator", "user"];

export const SUBSCRIPTION_TYPES: SubscriptionType[] = ["free", "paid"];

export function isStaffRole(role: AccountType): boolean {
  return role === "admin" || role === "moderator";
}
