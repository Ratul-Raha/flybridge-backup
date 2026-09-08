import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { verifyIdToken } from "@/lib/auth/token";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { User } from "@/lib/models/user";
import { emitEvent } from "@/lib/events/emit";
import { createOrder } from "@/lib/orders";
import {
  isStripeConfigured,
  createCheckoutSession,
} from "@/lib/payments/stripe";
import type { OrderDoc } from "@/lib/models/order";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { SubscriptionType } from "@/lib/roles";

type RegistrationBody = {
  name?: string;
  phone?: string;
  email?: string;
  idToken?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as RegistrationBody;
    await connectDb();

    const ip = clientIp(request);
    const limited = rateLimit(`seminar:register:${ip}`, 5, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again shortly." },
        { status: 429 }
      );
    }

    const seminar = await Seminar.findById(params.id);
    if (!seminar) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }

    const phone = body.phone?.trim() ?? "";
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    let email = body.email?.toLowerCase().trim() ?? "";
    let name = body.name?.trim() ?? "";
    let user = null;
    let userCreated = false;

    if (body.idToken) {
      try {
        const claims = await verifyIdToken(body.idToken);
        email = claims.email?.toLowerCase() ?? "";
        if (!email || !claims.email_verified) {
          return NextResponse.json(
            { error: "A verified email is required" },
            { status: 400 }
          );
        }
        name = claims.name?.trim() ?? name;
        user = await User.findOne({ email });
        if (user) {
          user.name = name || user.name;
          user.phone = phone || user.phone;
          if (!user.avatar && claims.picture) user.avatar = claims.picture;
          await user.save();
        } else {
          user = await User.create({
            firebaseUid: claims.uid,
            name: name || email.split("@")[0],
            email,
            avatar: claims.picture,
            phone,
            accountType: "user",
            subscription: "free" as SubscriptionType,
          });
          userCreated = true;
        }
      } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } else {
      const session = await readSession();
      if (!session?.userId) {
        return NextResponse.json(
          { error: "Authentication required. Please sign in." },
          { status: 401 }
        );
      }
      user = await User.findById(session.userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      email = user.email?.toLowerCase() ?? "";
      if (!email) {
        return NextResponse.json(
          { error: "Account email is missing" },
          { status: 400 }
        );
      }
      name = user.name?.trim() ?? "";
      if (!user.phone && phone) {
        user.phone = phone;
        await user.save();
      }
    }

    if (userCreated) {
      try {
        await emitEvent("user.registered", {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            accountType: user.accountType,
            subscription: user.subscription,
          },
        });
      } catch (emitError) {
        console.error("user.registered emit error", emitError);
      }
    }

    const { order, duplicate } = await createOrder({
      user: {
        id: user._id.toString(),
        name: name || user.name,
        email: user.email ?? email,
        phone: user.phone ?? phone,
      },
      itemType: "seminar",
      itemId: seminar._id.toString(),
    });

    let paymentUrl: string | null = null;
    if (order && order.total > 0) {
      if (!isStripeConfigured()) {
        return NextResponse.json(
          { error: "Payments are not configured yet. Please try again later." },
          { status: 503 }
        );
      }

      const checkout = await createCheckoutSession(order as OrderDoc, {
        origin: request.nextUrl.origin,
        email: user.email ?? email,
        cancelPath: `/seminars/${seminar._id.toString()}`,
      });

      const orderDoc = order as OrderDoc & { save(): Promise<unknown> };
      orderDoc.gateway = "stripe";
      orderDoc.gatewayRef = checkout.sessionId;
      await orderDoc.save();
      paymentUrl = checkout.url;
    }

    const registration = await SeminarRegistration.findOne({
      seminar: seminar._id,
      email,
    });

    return NextResponse.json(
      {
        ok: true,
        alreadyRegistered: duplicate,
        registration,
        orderId: order?._id?.toString() ?? null,
        requiresPayment: order ? order.total > 0 : false,
        paymentUrl,
      },
      { status: duplicate ? 200 : 201 }
    );
  } catch (error) {
    console.error("seminar register error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
