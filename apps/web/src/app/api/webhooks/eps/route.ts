import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { Order } from "@/lib/models/order";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { reconcileEPSOrder } from "@/lib/payments/eps";
import {
  EPSIPNError,
  decryptEPSIPNWithSecrets,
  type EPSIPNPayload,
} from "@/lib/payments/eps-ipn-crypto";
import { currentEPSIPNSecrets } from "@/lib/payments/eps-ipn";
import type { HydratedOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * EPS server-to-server IPN. Register this URL in the EPS merchant panel.
 *
 * EPS POSTs `{ "Data": "IV:CipherText" }` — AES-256-CBC, decrypted with the
 * merchant's IPN Secret Key (see lib/payments/eps-ipn).
 *
 * The decrypted body is a *trigger*, never evidence — exactly like the browser
 * return at /payment/success. It is used only to find the order, then
 * `reconcileEPSOrder` re-queries CheckMerchantTransactionStatus and re-checks
 * the collected amount against order.total before anything is fulfilled. A
 * forged, replayed or tampered IPN therefore cannot grant access.
 *
 * Answers with the { status, message } shape EPS documents.
 */
export async function POST(request: NextRequest) {
  const gate = rateLimit(`eps-ipn:${clientIp(request)}`, 60, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { status: "ERROR", message: "Too many requests" },
      { status: 429 }
    );
  }

  const secrets = await currentEPSIPNSecrets();
  if (secrets.length === 0) {
    console.error("eps ipn: no IPN secret is configured for the current mode");
    return NextResponse.json(
      { status: "ERROR", message: "Decryption failed or internal error" },
      { status: 500 }
    );
  }

  let payload: EPSIPNPayload;
  try {
    const body = (await request.json().catch(() => null)) as { Data?: unknown } | null;
    const data = typeof body?.Data === "string" ? body.Data : "";
    if (!data) throw new EPSIPNError("Malformed IPN payload: missing Data");
    payload = decryptEPSIPNWithSecrets(data, secrets);
  } catch (error) {
    // Nothing decrypted means nothing to trust. Report it so EPS stops retrying
    // and we keep the evidence in the logs.
    console.error("eps ipn decrypt error", error);
    return NextResponse.json(
      { status: "ERROR", message: "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    await connectDb();

    const order = await findOrder(payload);
    if (!order || order.gateway !== "eps" || order.status !== "pending") {
      // Unknown reference, or an order we have already dealt with. Answer OK so
      // EPS stops retrying — the response is never shown to a buyer.
      return NextResponse.json({
        status: "OK",
        message: "IPN received and saved successfully",
      });
    }

    // Re-verifies with EPS and cross-checks the amount before fulfilling.
    const result = await reconcileEPSOrder(order, { id: "eps-ipn" });
    console.log(
      `eps ipn: order ${result.orderId} (txn ${payload.transaction_id ?? "?"}) -> ${result.status}`
    );

    return NextResponse.json({
      status: "OK",
      message: "IPN received and saved successfully",
    });
  } catch (error) {
    // Transient failure (EPS unreachable, DB blip) — worth a retry.
    console.error("eps ipn handler error", error);
    return NextResponse.json(
      { status: "ERROR", message: "Decryption failed or internal error" },
      { status: 500 }
    );
  }
}

/** EPS reports its own reference; the order id travels in Value* or the reference. */
async function findOrder(payload: EPSIPNPayload): Promise<HydratedOrder | null> {
  const merchantTransactionId =
    readString(payload.merchant_transaction_id) ??
    readString(payload.merchantTransactionId);
  const epsTransactionId =
    readString(payload.transaction_id) ?? readString(payload.epsTransactionId);
  const orderId =
    readString(payload.order_id) ?? readString(payload.customer_order_id);

  if (orderId && /^[a-f\d]{24}$/i.test(orderId)) {
    const byId = (await Order.findById(orderId)) as HydratedOrder | null;
    if (byId) return byId;
  }
  if (merchantTransactionId) {
    const byRef = (await Order.findOne({
      merchantTransactionId,
    })) as HydratedOrder | null;
    if (byRef) return byRef;
  }
  if (epsTransactionId) {
    const byTxn = (await Order.findOne({
      gateway: "eps",
      gatewayRef: epsTransactionId,
    })) as HydratedOrder | null;
    if (byTxn) return byTxn;
  }
  return null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}