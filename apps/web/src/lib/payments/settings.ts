import "server-only";

import { connectDb } from "@/lib/db";
import { PaymentSettings } from "@/lib/models/payment-settings";

export type StripeMode = "test" | "live";
export type EpsMode = "sandbox" | "production";

export type PaymentSettingsState = {
  stripeMode: StripeMode;
  epsMode: EpsMode;
};

let cache: (PaymentSettingsState & { at: number }) | null = null;
const CACHE_TTL_MS = 15_000;

function envDefaults(): PaymentSettingsState {
  return {
    stripeMode: process.env.STRIPE_MODE === "live" ? "live" : "test",
    epsMode: process.env.EPS_ENV === "production" ? "production" : "sandbox",
  };
}

export async function loadPaymentSettings(options?: {
  force?: boolean;
}): Promise<PaymentSettingsState> {
  if (!options?.force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { stripeMode: cache.stripeMode, epsMode: cache.epsMode };
  }

  let state = envDefaults();
  try {
    await connectDb();
    const doc = await PaymentSettings.findOne({ _id: "gateways" }).lean<{
      stripe?: { mode?: string };
      eps?: { mode?: string };
    }>();
    if (doc?.stripe?.mode === "test" || doc?.stripe?.mode === "live") {
      state.stripeMode = doc.stripe.mode;
    }
    if (doc?.eps?.mode === "sandbox" || doc?.eps?.mode === "production") {
      state.epsMode = doc.eps.mode;
    }
  } catch (error) {
    console.error("payment settings load error", error);
  }

  cache = { ...state, at: Date.now() };
  return state;
}

export async function savePaymentSettings(
  patch: Partial<PaymentSettingsState>
): Promise<PaymentSettingsState> {
  await connectDb();
  const current = await loadPaymentSettings({ force: true });
  const next: PaymentSettingsState = {
    stripeMode: patch.stripeMode ?? current.stripeMode,
    epsMode: patch.epsMode ?? current.epsMode,
  };

  await PaymentSettings.updateOne(
    { _id: "gateways" },
    {
      $set: {
        stripe: { mode: next.stripeMode },
        eps: { mode: next.epsMode },
      },
    },
    { upsert: true }
  );

  cache = { ...next, at: Date.now() };
  return next;
}