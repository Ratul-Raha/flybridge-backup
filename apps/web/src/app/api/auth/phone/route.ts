import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { connectDb } from "@/lib/db";
import { readSession, USER_SNAPSHOT_TAG } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone : "";

    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number for your selected country" },
        { status: 400 }
      );
    }

    await connectDb();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.phone = normalized;
    await user.save();
    revalidateTag(USER_SNAPSHOT_TAG);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar ?? null,
        accountType: session.role,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error("auth/phone error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
