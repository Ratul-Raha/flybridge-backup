/**
 * EPS IPN Secret Key resolution — pure, no env or `server-only` access so it
 * stays unit-testable, matching the split in ./eps-ipn-crypto. The module that
 * reads process.env lives in ./eps-ipn and keeps the server-only guard.
 *
 * The IPN Secret Key comes from the EPS merchant panel and differs per
 * environment, exactly like the merchant credentials in ./eps. It is also
 * distinct from EPS_*_HASH_KEY, which signs the outbound x-hash header.
 */

export type EpsEnvironment = "sandbox" | "production";

type Env = Record<string, string | undefined>;

/** Blank, or one of the placeholder values shipped in .env.example. */
function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /placeholder|replace_me/i.test(trimmed) ? null : trimmed;
}

/**
 * Candidate IPN secrets, most likely first.
 *
 * The scoped secret for `mode` leads, so a merchant whose gateway toggle is set
 * to "production" decrypts with their production key. The generic
 * EPS_IPN_SECRET follows as the single-environment case, and the opposite
 * environment's secret comes last: an IPN can land after the toggle has been
 * flipped away from the environment the payment was actually started in, and
 * there is no mode on the wire to tell the two apart. A stale decryption only
 * ever yields an order reference — status and amount are always re-checked
 * against CheckMerchantTransactionStatus before an order is fulfilled.
 */
export function ipnSecretCandidates(
  env: Env,
  mode: EpsEnvironment
): string[] {
  const other: EpsEnvironment = mode === "production" ? "sandbox" : "production";
  const ordered = [
    env[`EPS_${mode.toUpperCase()}_IPN_SECRET`],
    env.EPS_IPN_SECRET,
    env[`EPS_${other.toUpperCase()}_IPN_SECRET`],
  ];

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const value of ordered) {
    const secret = clean(value);
    if (secret && !seen.has(secret)) {
      seen.add(secret);
      candidates.push(secret);
    }
  }
  return candidates;
}