import "server-only";

/**
 * Resolves the EPS IPN decryption key.
 *
 * This is the only part of the IPN path that touches credentials, so this is
 * the only part that needs the `server-only` guard. The decryption itself is
 * pure crypto and lives in ./eps-ipn-crypto so it can be unit-tested.
 *
 * The IPN Secret Key from the EPS merchant panel is distinct from
 * EPS_*_HASH_KEY (which signs the outbound x-hash header).
 */
export function currentEPSIPNSecret(): string | null {
  const secret =
    process.env.EPS_IPN_SECRET ??
    process.env[`EPS_PRODUCTION_IPN_SECRET`] ??
    process.env[`EPS_SANDBOX_IPN_SECRET`] ??
    "";
  const trimmed = secret.trim();
  return trimmed && !trimmed.includes("placeholder") ? trimmed : null;
}