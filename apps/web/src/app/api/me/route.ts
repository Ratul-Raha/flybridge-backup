import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { isValidBdPhone, normalizeBdPhone } from "@/lib/phone";

const ADDRESS_KEYS = ["street", "city", "state", "country", "postalCode"] as const;

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
      address: user.address ?? {},
      accountType: session.role,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error("me GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (typeof body.name === "string" && body.name.trim()) {
      user.name = body.name.trim();
    }
    if (typeof body.phone === "string") {
      const normalized = normalizeBdPhone(body.phone);
      if (!isValidBdPhone(normalized)) {
        return NextResponse.json(
          { error: "A valid Bangladeshi phone number is required (e.g., +8801XXXXXXXXX)" },
          { status: 400 }
        );
      }
      user.phone = normalized;
    }
    if (typeof body.avatar === "string") {
      user.avatar = body.avatar.trim() || undefined;
    }
    if (body.address && typeof body.address === "object") {
      const next: Record<string, string> = {};
      for (const key of ADDRESS_KEYS) {
        const value = body.address[key];
        if (typeof value === "string") next[key] = value.trim();
      }
      user.address = next;
    }

    await user.save();

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        avatar: user.avatar ?? null,
        address: user.address ?? {},
        accountType: session.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error("me PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
