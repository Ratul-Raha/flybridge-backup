import crypto from "crypto";

/**
 * EPS IPN payload decryption — pure crypto, no env access and no I/O.
 * Deliberately free of `server-only` so it stays unit-testable; the module that
 * reads the secret lives in ./eps-ipn.ts and keeps that guard.
 *
 * EPS POSTs `{ "Data": "IV:CipherText" }` where both halves are Base64 and the
 * cipher is AES-256-CBC with PKCS7 padding. The merchant's IPN Secret Key is
 * the encryption key — but that key is 18 bytes ("SEC…"), and AES-256 needs a
 * 32-byte key, so EPS must derive one. EPS's public docs do not say how.
 *
 * Because of that we try each derivation in turn and accept the first one that
 * yields well-formed JSON with a recognisable shape. That is safe here and
 * nowhere else: the decrypted body is still only used to learn *which*
 * transaction to look up. Status, amount and fulfilment are always re-checked
 * against EPS's own CheckMerchantTransactionStatus API before an order is
 * completed, so a wrong guess cannot grant access — it can only fall back to
 * the reconciliation cron.
 *
 * Once EPS confirms the derivation, delete the losing candidates.
 */

export class EPSIPNError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EPSIPNError";
  }
}

export type EPSIPNPayload = {
  transaction_id?: string;
  merchant_transaction_id?: string;
  amount?: number | string;
  store_amount?: number | string;
  status?: string;
  payment_method?: string;
  customer_email?: string;
  timestamp?: string;
  [key: string]: unknown;
};

/**
 * Candidate ways to stretch the 18-byte secret into an AES-256 key.
 * Ordered by how likely each is, based on how PHP gateways usually do it.
 */
const KEY_DERIVATIONS: readonly ((secret: string) => Buffer)[] = [
  // crypto.createHash("sha256").update(secret).digest()  — hash('sha256', $s, true)
  (secret) => crypto.createHash("sha256").update(secret, "utf8").digest(),

  // hash('sha256', $s) truncated to 32 bytes — the common PHP idiom, where the
  // hex digest is used as ASCII and PHP silently keeps only the first 32 bytes.
  (secret) =>
    Buffer.from(crypto.createHash("sha256").update(secret, "utf8").digest("hex"), "utf8").subarray(0, 32),

  // Secret used as-is and right-padded to 32 bytes.
  (secret) => {
    const raw = Buffer.from(secret, "utf8");
    if (raw.length >= 32) return raw.subarray(0, 32);
    return Buffer.concat([raw, Buffer.alloc(32 - raw.length)]);
  },
];

function splitData(data: string): { iv: Buffer; cipherText: Buffer } {
  // EPS separates the two Base64 halves with a colon. The IV half itself can
  // never contain one, so split on the *first* colon only.
  const separator = data.indexOf(":");
  if (separator <= 0 || separator === data.length - 1) {
    throw new EPSIPNError("Malformed IPN payload: expected IV:CipherText");
  }

  const iv = Buffer.from(data.slice(0, separator), "base64");
  const cipherText = Buffer.from(data.slice(separator + 1), "base64");

  if (iv.length !== 16) {
    throw new EPSIPNError(`Malformed IPN payload: IV is ${iv.length} bytes, expected 16`);
  }
  if (cipherText.length === 0 || cipherText.length % 16 !== 0) {
    throw new EPSIPNError("Malformed IPN payload: ciphertext is not a whole number of AES blocks");
  }

  return { iv, cipherText };
}

/** A decrypted payload is only believable if it actually looks like one. */
function looksLikePayload(value: unknown): value is EPSIPNPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const hasReference =
    typeof record.merchant_transaction_id === "string" ||
    typeof record.transaction_id === "string";
  return hasReference;
}

/**
 * Decrypt an EPS IPN body into its JSON payload.
 * Throws EPSIPNError for anything malformed or undecryptable.
 */
export function decryptEPSIPN(data: string, secret: string): EPSIPNPayload {
  return decryptEPSIPNWithSecrets(data, [secret]);
}

/**
 * Try each candidate secret in turn and return the first payload that decrypts
 * to a believable shape. Callers that hold more than one secret — because the
 * gateway mode may have been toggled between the payment and the IPN — pass
 * them all; ordering only affects speed, not the result.
 */
export function decryptEPSIPNWithSecrets(
  data: string,
  secrets: readonly string[]
): EPSIPNPayload {
  const { iv, cipherText } = splitData(data.trim());

  for (const secret of secrets) {
    for (const derive of KEY_DERIVATIONS) {
      let plain: Buffer;
      try {
        const decipher = crypto.createDecipheriv("aes-256-cbc", derive(secret), iv);
        plain = Buffer.concat([decipher.update(cipherText), decipher.final()]);
      } catch {
        // Wrong key for this derivation — bad padding almost always. Try the next.
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(plain.toString("utf8"));
      } catch {
        // Right key, wrong derivation order can still land on garbage bytes.
        continue;
      }

      if (looksLikePayload(parsed)) return parsed;
    }
  }

  throw new EPSIPNError("Could not decrypt IPN payload with the configured secret");
}