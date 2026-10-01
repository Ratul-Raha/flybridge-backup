import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { EPSIPNError, decryptEPSIPN } from "./eps-ipn-crypto.ts";

const SECRET = "SEC361976249198185";

const PAYLOAD = {
  transaction_id: "EPS999",
  merchant_transaction_id: "20260101120000123456",
  amount: 2999,
  store_amount: 2900,
  status: "SUCCESS",
  payment_method: "bKash",
  customer_email: "buyer@example.com",
  timestamp: "2026-10-01T05:00:00Z",
};

/** Mirrors the candidate derivations so we can encrypt a fixture with each. */
const DERIVATIONS = {
  "sha256 raw bytes": (s: string) =>
    crypto.createHash("sha256").update(s, "utf8").digest(),
  "sha256 hex truncated to 32": (s: string) =>
    Buffer.from(crypto.createHash("sha256").update(s, "utf8").digest("hex"), "utf8").subarray(0, 32),
  "secret zero-padded to 32": (s: string) => {
    const raw = Buffer.from(s, "utf8");
    return raw.length >= 32 ? raw.subarray(0, 32) : Buffer.concat([raw, Buffer.alloc(32 - raw.length)]);
  },
} as const;

function encrypt(secret: string, derive: (s: string) => Buffer, payload: unknown): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", derive(secret), iv);
  const cipherText = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(payload), "utf8")),
    cipher.final(),
  ]);
  return `${iv.toString("base64")}:${cipherText.toString("base64")}`;
}

describe("decryptEPSIPN", () => {
  // EPS's derivation is undocumented, so the module tries candidates in turn.
  // Every one must round-trip or a real payment would go unfulfilled.
  for (const [name, derive] of Object.entries(DERIVATIONS)) {
    it(`decrypts a payload produced with: ${name}`, () => {
      const out = decryptEPSIPN(encrypt(SECRET, derive, PAYLOAD), SECRET);
      assert.equal(out.merchant_transaction_id, PAYLOAD.merchant_transaction_id);
      assert.equal(out.transaction_id, PAYLOAD.transaction_id);
      assert.equal(out.status, PAYLOAD.status);
      assert.equal(out.amount, PAYLOAD.amount);
    });
  }

  it("preserves an order id that reaches us as a string", () => {
    const derive = DERIVATIONS["sha256 raw bytes"];
    const out = decryptEPSIPN(encrypt(SECRET, derive, { ...PAYLOAD, amount: "2999.00" }), SECRET);
    assert.equal(out.amount, "2999.00");
  });

  it("rejects a payload encrypted with a different secret", () => {
    const wire = encrypt("SEC000000000000000", DERIVATIONS["sha256 raw bytes"], PAYLOAD);
    assert.throws(() => decryptEPSIPN(wire, SECRET), EPSIPNError);
  });

  it("rejects a payload with no IV:CipherText separator", () => {
    assert.throws(() => decryptEPSIPN("no-colon-here", SECRET), /expected IV:CipherText/);
  });

  it("rejects an IV that is not 16 bytes", () => {
    const short = Buffer.alloc(8).toString("base64");
    assert.throws(() => decryptEPSIPN(`${short}:AAAA`, SECRET), /IV is 8 bytes, expected 16/);
  });

  it("rejects ciphertext that is not a whole number of AES blocks", () => {
    const iv = crypto.randomBytes(16).toString("base64");
    assert.throws(
      () => decryptEPSIPN(`${iv}:${Buffer.alloc(20).toString("base64")}`, SECRET),
      /whole number of AES blocks/
    );
  });

  it("rejects an empty Data value", () => {
    assert.throws(() => decryptEPSIPN("", SECRET), EPSIPNError);
  });

  // Guards the "accept the first plausible decryption" fallback: a wrong key can
  // occasionally yield valid padding, so the shape check has to reject it.
  it("rejects well-formed JSON that is not an EPS payload", () => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      DERIVATIONS["sha256 raw bytes"](SECRET),
      iv
    );
    const cipherText = Buffer.concat([
      cipher.update(Buffer.from(JSON.stringify({ hello: "world" }), "utf8")),
      cipher.final(),
    ]);
    const wire = `${iv.toString("base64")}:${cipherText.toString("base64")}`;
    assert.throws(() => decryptEPSIPN(wire, SECRET), /Could not decrypt IPN payload/);
  });
});