import "server-only";

import { loadPaymentSettings } from "@/lib/payments/settings";
import { ipnSecretCandidates } from "@/lib/payments/eps-ipn-secret";

/**
 * Resolves the EPS IPN decryption keys for the current gateway mode.
 *
 * This is the only part of the IPN path that touches credentials, so this is
 * the only part that needs the `server-only` guard. The decryption itself is
 * pure crypto and lives in ./eps-ipn-crypto, and the ordering logic in
 * ./eps-ipn-secret, so both stay unit-tested.
 *
 * Returns candidates rather than a single key: the mode an IPN was sent under
 * is not on the wire, so an IPN that arrives after the admin toggle has been
 * flipped still has to decrypt.
 */
export async function currentEPSIPNSecrets(): Promise<string[]> {
  const { epsMode } = await loadPaymentSettings();
  return ipnSecretCandidates(process.env, epsMode);
}
