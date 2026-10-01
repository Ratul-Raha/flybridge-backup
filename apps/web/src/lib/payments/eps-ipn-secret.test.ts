import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { ipnSecretCandidates } from "./eps-ipn-secret.ts";
import {
  decryptEPSIPN,
  decryptEPSIPNWithSecrets,
  EPSIPNError,
} from "./eps-ipn-crypto.ts";

const PROD = "SECproductionkey0000000001";
const SANDBOX = "SECsandboxkey000000000001";

/** Encrypt a payload the way EPS does, with the derivation EPS actually uses. */
function seal(secret: string, body: Record<string, unknown>): string {
  const key = crypto.createHash("sha256").update(secret, "utf8").digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const plain = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(body), "utf8")),
    cipher.final(),
  ]);
  return `${iv.toString("base64")}:${plain.toString("base64")}`;
}

const ORDER = { merchant_transaction_id: "MTX-1", amount: 2999 };

describe("ipnSecretCandidates", () => {
  it("leads with the secret scoped to the active mode", () => {
    const env = {
      EPS_PRODUCTION_IPN_SECRET: PROD,
      EPS_SANDBOX_IPN_SECRET: SANDBOX,
    };
    assert.deepEqual(ipnSecretCandidates(env, "production"), [PROD, SANDBOX]);
    assert.deepEqual(ipnSecretCandidates(env, "sandbox"), [SANDBOX, PROD]);
  });

  it("keeps the generic EPS_IPN_SECRET as a fallback", () => {
    assert.deepEqual(
      ipnSecretCandidates({ EPS_IPN_SECRET: PROD }, "production"),
      [PROD]
    );
  });

  it("does not let the generic secret shadow a scoped one", () => {
    const candidates = ipnSecretCandidates(
      { EPS_IPN_SECRET: PROD, EPS_SANDBOX_IPN_SECRET: SANDBOX },
      "sandbox"
    );
    assert.deepEqual(candidates, [SANDBOX, PROD]);
  });

  it("drops blanks, placeholders and duplicates", () => {
    const candidates = ipnSecretCandidates(
      {
        EPS_PRODUCTION_IPN_SECRET: "   ",
        EPS_IPN_SECRET: "replace_me",
        EPS_SANDBOX_IPN_SECRET: SANDBOX,
        EPS_PRODUCTION_IPN_SECRET_ALT: SANDBOX,
      },
      "production"
    );
    assert.deepEqual(candidates, [SANDBOX]);
  });

  it("returns nothing when no secret is configured", () => {
    assert.deepEqual(ipnSecretCandidates({}, "production"), []);
  });
});

describe("decryptEPSIPNWithSecrets", () => {
  it("decrypts with the first candidate", () => {
    const data = seal(PROD, ORDER);
    assert.deepEqual(
      decryptEPSIPNWithSecrets(data, [PROD, SANDBOX]),
      ORDER
    );
  });

  it("decrypts with a later candidate, covering a post-toggle IPN", () => {
    // Sandbox order, IPN arrives after the merchant flipped to production.
    const data = seal(SANDBOX, ORDER);
    const candidates = ipnSecretCandidates(
      { EPS_PRODUCTION_IPN_SECRET: PROD, EPS_SANDBOX_IPN_SECRET: SANDBOX },
      "production"
    );
    assert.deepEqual(decryptEPSIPNWithSecrets(data, candidates), ORDER);
  });

  it("still throws when no candidate matches", () => {
    const data = seal(PROD, ORDER);
    assert.throws(() => decryptEPSIPNWithSecrets(data, [SANDBOX]), EPSIPNError);
  });

  it("agrees with the single-secret entry point", () => {
    const data = seal(SANDBOX, ORDER);
    assert.deepEqual(decryptEPSIPN(data, SANDBOX), ORDER);
  });
});