import "server-only";

import crypto from "crypto";
import { connectDb } from "@/lib/db";
import { Order, type OrderDoc, type OrderItemType } from "@/lib/models/order";
import { fulfillOrder, type HydratedOrder } from "@/lib/orders";
import { loadPaymentSettings } from "@/lib/payments/settings";
import type { ReconcileResult } from "@/lib/payments/types";

/**
 * EPS — Easy Payment System (Bangladesh) gateway.
 * https://www.eps.com.bd
 *
 * Sandbox / production REST API signed with HMACSHA512 hashes and a JWT
 * access token (fetched with the merchant username/password).
 */

type EPSEnvironment = "sandbox" | "production";

const ENDPOINTS: Record<
  EPSEnvironment,
  { token: string; initialize: string; verify: string }
> = {
  sandbox: {
    token: "https://sandboxpgapi.eps.com.bd/v1/Auth/GetToken",
    initialize: "https://sandboxpgapi.eps.com.bd/v1/EPSEngine/InitializeEPS",
    verify:
      "https://sandboxpgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus",
  },
  production: {
    token: "https://pgapi.eps.com.bd/v1/Auth/GetToken",
    initialize: "https://pgapi.eps.com.bd/v1/EPSEngine/InitializeEPS",
    verify:
      "https://pgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus",
  },
};

type EPSConfig = {
  username: string;
  password: string;
  hashKey: string;
  merchantId: string;
  storeId: string;
  environment: EPSEnvironment;
};

/**
 * Public EPS sandbox credentials supplied for development. They are only
 * used when EPS_ENV is not `production`, and any real credentials provided
 * via environment variables always take precedence.
 */
const SANDBOX_CREDENTIALS = {
  username: "Epsdemo@gmail.com",
  password: "Epsdemo258@",
  hashKey: "FHZxyzeps56789gfhg678ygu876o=",
  merchantId: "29e86e70-0ac6-45eb-ba04-9fcb0aaed12a",
  storeId: "d44e705f-9e3a-41de-98b1-1674631637da",
} as const;

async function config(mode?: EPSEnvironment): Promise<EPSConfig> {
  const environment = mode ?? (await currentEPSMode());
  const creds = environment === "production" ? undefined : SANDBOX_CREDENTIALS;
  return {
    username: process.env.EPS_USERNAME || creds?.username || "",
    password: process.env.EPS_PASSWORD || creds?.password || "",
    hashKey: process.env.EPS_HASH_KEY || creds?.hashKey || "",
    merchantId: process.env.EPS_MERCHANT_ID || creds?.merchantId || "",
    storeId: process.env.EPS_STORE_ID || creds?.storeId || "",
    environment,
  };
}

export async function currentEPSMode(): Promise<EPSEnvironment> {
  const { epsMode } = await loadPaymentSettings();
  return epsMode;
}

export function asEPSMode(value: string | null | undefined): EPSEnvironment | null {
  return value === "production" || value === "sandbox" ? value : null;
}

export async function isEPSConfigured(mode?: EPSEnvironment): Promise<boolean> {
  const c = await config(mode);
  return Boolean(
    c.username &&
      c.password &&
      c.hashKey &&
      c.merchantId &&
      c.storeId
  );
}

function generateHash(value: string, hashKey: string): string {
  return crypto
    .createHmac("sha512", Buffer.from(hashKey, "utf8"))
    .update(value, "utf8")
    .digest("base64");
}

export function generateMerchantTransactionId(): string {
  const d = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const stamp = [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
    pad(d.getMilliseconds(), 3),
  ].join("");
  return `${stamp}${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;
}

let cachedToken: {
  token: string;
  expiresAt: number;
  environment: EPSEnvironment;
} | null = null;

async function getToken(environment: EPSEnvironment): Promise<string> {
  const c = await config(environment);
  if (
    cachedToken &&
    cachedToken.environment === environment &&
    Date.now() < cachedToken.expiresAt - 30_000
  ) {
    return cachedToken.token;
  }

  const res = await fetch(ENDPOINTS[c.environment].token, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hash": generateHash(c.username, c.hashKey),
    },
    body: JSON.stringify({ userName: c.username, password: c.password }),
  });
  if (!res.ok) {
    throw new Error(`EPS authentication failed (${res.status})`);
  }

  const data = (await res.json()) as {
    token?: string;
    expireDate?: string;
    errorMessage?: string | null;
    errorCode?: string | null;
  };
  if (!data.token || data.errorMessage || data.errorCode) {
    throw new Error(data.errorMessage || "EPS authentication failed");
  }

  const expiresAt =
    (data.expireDate && Date.parse(data.expireDate)) ||
    Date.now() + 12 * 60 * 60 * 1000;
  cachedToken = { token: data.token, expiresAt, environment: c.environment };
  return data.token;
}

export function cancelPathFor(itemType: OrderItemType, itemId: string): string {
  if (itemType === "course") return `/programs/${itemId}/checkout`;
  if (itemType === "seminar") return `/seminars/${itemId}`;
  if (itemType === "resource") return `/resources/${itemId}`;
  if (itemType === "mock-bundle") return `/mock-tests/${itemId}`;
  return "/dashboard";
}

export type EPSPaymentResult = {
  url: string;
  transactionId: string;
  merchantTransactionId: string;
  mode: EPSEnvironment;
};

export async function createEPSPayment(opts: {
  order: OrderDoc;
  origin: string;
  customer: { name: string; email: string; phone?: string | null };
  cancelPath?: string;
  ipAddress?: string;
  mode?: EPSEnvironment;
}): Promise<EPSPaymentResult> {
  const c = await config(opts.mode);
  if (!(await isEPSConfigured(c.environment))) throw new Error("Payment provider is not configured");
  const order = opts.order;
  const item = order.items[0];
  if (!item) throw new Error("Order has no items");

  const merchantTransactionId = generateMerchantTransactionId();
  const orderId = order._id.toString();
  const origin = opts.origin;
  const token = await getToken(c.environment);

  const body: Record<string, unknown> = {
    merchantId: c.merchantId,
    storeId: c.storeId,
    CustomerOrderId: orderId,
    merchantTransactionId,
    transactionTypeId: 1,
    financialEntityId: 0,
    transitionStatusId: 0,
    totalAmount: order.total,
    ipAddress: opts.ipAddress ?? "0.0.0.0",
    version: "1",
    successUrl: `${origin}/payment/success?order=${orderId}`,
    failUrl: `${origin}/payment/success?order=${orderId}`,
    cancelUrl: `${origin}${opts.cancelPath ?? cancelPathFor(item.itemType, item.itemId)}`,
    customerName: opts.customer.name,
    customerEmail: opts.customer.email,
    CustomerAddress: "Dhaka",
    CustomerAddress2: "",
    CustomerCity: "Dhaka",
    CustomerState: "Dhaka",
    CustomerPostcode: "1200",
    CustomerCountry: "BD",
    CustomerPhone: opts.customer.phone ?? "01700000000",
    ShipmentName: "",
    ShipmentAddress: "",
    ShipmentAddress2: "",
    ShipmentCity: "",
    ShipmentState: "",
    ShipmentPostcode: "",
    ShipmentCountry: "",
    ValueA: "",
    ValueB: "",
    ValueC: "",
    ValueD: "",
    ShippingMethod: "NO",
    NoOfItem: "1",
    ProductName: item.title || "FlyBridge purchase",
    ProductProfile: "general",
    ProductCategory: "general",
    ProductList: [],
  };

  const res = await fetch(ENDPOINTS[c.environment].initialize, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hash": generateHash(merchantTransactionId, c.hashKey),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`EPS payment initialization failed (${res.status})`);
  }

  const data = (await res.json()) as {
    TransactionId?: string;
    RedirectURL?: string;
    ErrorMessage?: string;
    ErrorCode?: string | null;
  };
  if (data.ErrorMessage || !data.RedirectURL || !data.TransactionId) {
    throw new Error(data.ErrorMessage || "EPS payment initialization failed");
  }

  return {
    url: data.RedirectURL,
    transactionId: data.TransactionId,
    merchantTransactionId,
    mode: c.environment,
  };
}

export type EPSVerifyParams = {
  merchantTransactionId?: string;
  epsTransactionId?: string;
  mode?: EPSEnvironment;
};

export type EPSVerifyResult = {
  status: string;
  epsTransactionId: string;
  merchantTransactionId: string;
  totalAmount: string;
};

export async function verifyEPSTransaction(
  params: EPSVerifyParams
): Promise<EPSVerifyResult> {
  const c = await config(params.mode);
  if (!(await isEPSConfigured(c.environment))) throw new Error("Payment provider is not configured");
  if (!params.merchantTransactionId && !params.epsTransactionId) {
    throw new Error("A transaction id is required");
  }

  const token = await getToken(c.environment);
  const hashValue = params.merchantTransactionId || params.epsTransactionId!;
  const query = new URLSearchParams();
  if (params.merchantTransactionId) {
    query.append("merchantTransactionId", params.merchantTransactionId);
  }
  if (params.epsTransactionId) {
    query.append("EPSTransactionId", params.epsTransactionId);
  }

  const res = await fetch(
    `${ENDPOINTS[c.environment].verify}?${query.toString()}`,
    {
      headers: {
        "x-hash": generateHash(hashValue, c.hashKey),
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`EPS transaction verification failed (${res.status})`);
  }

  const data = (await res.json()) as {
    Status?: string;
    transactionStatus?: string;
    MerchantTransactionId?: string;
    EpsTransactionId?: string;
    TotalAmount?: string;
    ErrorMessage?: string;
    ErrorCode?: string | null;
  };
  if (data.ErrorMessage || data.ErrorCode) {
    throw new Error(data.ErrorMessage || "EPS transaction verification failed");
  }

  return {
    status: data.Status ?? data.transactionStatus ?? "Unknown",
    merchantTransactionId: data.MerchantTransactionId ?? params.merchantTransactionId ?? "",
    epsTransactionId: data.EpsTransactionId ?? params.epsTransactionId ?? "",
    totalAmount: data.TotalAmount ?? "",
  };
}

export async function reconcileEPSOrder(
  existing: HydratedOrder,
  _viewer: { id: string; name?: string; email?: string; isAdmin?: boolean }
): Promise<ReconcileResult> {
  await connectDb();

  const item = existing.items[0];
  const base = {
    orderId: existing._id.toString(),
    itemType: item?.itemType,
    itemId: item?.itemId,
  } satisfies Omit<ReconcileResult, "status">;

  if (
    existing.gateway !== "eps" ||
    (!existing.merchantTransactionId && !existing.gatewayRef)
  ) {
    return { status: existing.status, ...base };
  }

  let result: EPSVerifyResult | null = null;
  try {
    const mode = asEPSMode(existing.gatewayMode) ?? (await currentEPSMode());
    result = await verifyEPSTransaction({
      merchantTransactionId: existing.merchantTransactionId || undefined,
      epsTransactionId: existing.gatewayRef || undefined,
      mode,
    });
  } catch (error) {
    console.error("eps reconcile verify error", error);
  }

  if (result && /^success$/i.test(result.status)) {
    const fresh = (await Order.findById(existing._id)) as HydratedOrder | null;
    if (fresh && fresh.status === "pending") {
      await fulfillOrder(fresh);
      const it = fresh.items[0];
      return {
        status: "completed",
        orderId: fresh._id.toString(),
        itemType: it?.itemType,
        itemId: it?.itemId,
      };
    }
    return { status: fresh?.status ?? "unknown", ...base };
  }

  if (
    result &&
    /fail|decline|expired|cancelled|rejected/i.test(result.status)
  ) {
    if (existing.status === "pending") {
      existing.status = "failed";
      await existing.save();
    }
    return { status: "failed", ...base };
  }

  return { status: existing.status, ...base };
}