import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { verifyIdToken } from "@/lib/auth/token";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { newSessionId, registerSession } from "@/lib/auth/sessions";
import { User } from "@/lib/models/user";
import { emitEvent } from "@/lib/events/emit";
import type { SubscriptionType } from "@/lib/roles";
import { normalizePhone, isValidPhone } from "@/lib/phone";

type Claims = Awaited<ReturnType<typeof verifyIdToken>>;

const TRANSIENT_PATTERNS = [
  "connection closed",
  "connection to host closed",
  "topology is closed",
  "use a session that has ended",
  "timed out",
  "socket",
  "network",
  "econnreset",
  "econnrefused",
];

function isTransientDbError(error: unknown): boolean {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name)
      : "";
  if (name.startsWith("Mongo")) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return TRANSIENT_PATTERNS.some((p) => message.includes(p));
}

async function loadOrCreateUser(
  email: string,
  claims: Claims,
  source?: string | null
) {
  await connectDb();

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      firebaseUid: claims.uid,
      name: claims.name?.trim() || email.split("@")[0],
      email,
      avatar: claims.picture,
      phone: (() => {
        const raw = claims.phone_number;
        if (!raw) return undefined;
        const normalized = normalizePhone(raw);
        return isValidPhone(normalized) ? normalized : undefined;
      })(),
      accountType: "user",
      subscription: "free" as SubscriptionType,
      signupSource: source ?? null,
    });
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
  } else {
    user.firebaseUid = user.firebaseUid || claims.uid;
    if (!user.avatar && claims.picture) user.avatar = claims.picture;
    if (!user.name && claims.name) user.name = claims.name;
    await user.save();
  }
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken as string | undefined;
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const source =
      typeof body?.source === "string" && body.source.length > 0
        ? body.source.slice(0, 60)
        : null;

    let claims;
    try {
      claims = await verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = claims.email?.toLowerCase() ?? "";
    if (!email || !claims.email_verified) {
      return NextResponse.json(
        { error: "A verified email is required" },
        { status: 400 }
      );
    }

    let user;
    try {
      user = await loadOrCreateUser(email, claims, source);
    } catch (dbError) {
      if (!isTransientDbError(dbError)) throw dbError;
      console.warn("auth/google transient db error, retrying", dbError);
      await new Promise((resolve) => setTimeout(resolve, 300));
      user = await loadOrCreateUser(email, claims, source);
    }

    const ua = request.headers.get("user-agent") ?? null;
    const isStaff = user.accountType === "admin" || user.accountType === "moderator";

    let sessionId: string | undefined;
    if (!isStaff) {
      sessionId = newSessionId();
      try {
        await registerSession(user._id.toString(), sessionId, ua);
      } catch (error) {
        console.error("session registration error", error);
        // Fail open: a tracking hiccup shouldn't block sign-in.
        sessionId = undefined;
      }
    }

    const session = await createSession({
      uid: claims.uid,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.accountType,
      subscription: user.subscription,
      sessionId,
    });

    const res = NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone ?? null,
        accountType: user.accountType,
        subscription: user.subscription,
      },
    });
    res.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (error) {
    console.error("auth/google error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
