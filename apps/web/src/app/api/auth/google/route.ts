import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { verifyIdToken } from "@/lib/auth/token";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import type { SubscriptionType } from "@/lib/roles";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken as string | undefined;
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

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

    await connectDb();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firebaseUid: claims.uid,
        name: claims.name?.trim() || email.split("@")[0],
        email,
        avatar: claims.picture,
        phone: claims.phone_number,
        accountType: "user",
        subscription: "free" as SubscriptionType,
      });
    } else {
      user.firebaseUid = user.firebaseUid || claims.uid;
      if (!user.avatar && claims.picture) user.avatar = claims.picture;
      if (!user.name && claims.name) user.name = claims.name;
      await user.save();
    }

    const session = await createSession({
      uid: claims.uid,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.accountType,
      subscription: user.subscription,
    });

    const res = NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
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
