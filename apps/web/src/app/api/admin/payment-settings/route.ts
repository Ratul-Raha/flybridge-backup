import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { loadPaymentSettings, savePaymentSettings } from "@/lib/payments/settings";
import { isEPSConfigured } from "@/lib/payments/eps";

function isStripeMode(value: unknown): value is "test" | "live" {
  return value === "test" || value === "live";
}

function isEpsMode(value: unknown): value is "sandbox" | "production" {
  return value === "sandbox" || value === "production";
}

function secretAppearsLive(key: string | undefined): boolean {
  return !!key && key.startsWith("sk_live_") && !key.includes("placeholder");
}

function secretAppearsTest(key: string | undefined): boolean {
  return !!key && key.startsWith("sk_test_") && !key.includes("placeholder");
}

function epsEnvCompleteness(): Promise<boolean> {
  return isEPSConfigured("production");
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const state = await loadPaymentSettings({ force: true });

    const stripeTestKey =
      process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;
    const stripeLiveKey = process.env.STRIPE_SECRET_KEY;

    return NextResponse.json({
      stripe: {
        mode: state.stripeMode,
        testKey: secretAppearsTest(stripeTestKey),
        liveKey: secretAppearsLive(stripeLiveKey),
        testWebhook: Boolean(
          process.env.STRIPE_WEBHOOK_SECRET_TEST &&
            !process.env.STRIPE_WEBHOOK_SECRET_TEST.includes("placeholder")
        ),
        liveWebhook: Boolean(
          process.env.STRIPE_WEBHOOK_SECRET &&
            !process.env.STRIPE_WEBHOOK_SECRET.includes("placeholder")
        ),
      },
      eps: {
        mode: state.epsMode,
        envCreds: await epsEnvCompleteness(),
      },
    });
  } catch (error) {
    console.error("payment-settings GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json()) as { stripeMode?: unknown; epsMode?: unknown };

    if (body.stripeMode !== undefined && !isStripeMode(body.stripeMode)) {
      return NextResponse.json({ error: "Invalid stripeMode" }, { status: 400 });
    }
    if (body.epsMode !== undefined && !isEpsMode(body.epsMode)) {
      return NextResponse.json({ error: "Invalid epsMode" }, { status: 400 });
    }
    if (body.stripeMode === undefined && body.epsMode === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const state = await savePaymentSettings({
      stripeMode: body.stripeMode as "test" | "live" | undefined,
      epsMode: body.epsMode as "sandbox" | "production" | undefined,
    });

    return NextResponse.json({ ok: true, stripe: { mode: state.stripeMode }, eps: { mode: state.epsMode } });
  } catch (error) {
    console.error("payment-settings PUT error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}