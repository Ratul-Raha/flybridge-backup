import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  try {
    await connectDb();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        avatar: user.avatar ?? null,
        address: user.address ?? {},
        accountType: user.accountType,
        subscription: user.subscription,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("auth/session error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
