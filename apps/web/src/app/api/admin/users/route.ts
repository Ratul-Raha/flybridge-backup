import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";

export async function GET() {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const users = await User.find().sort({ createdAt: -1 }).limit(200).lean();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone ?? null,
        avatar: u.avatar ?? null,
        accountType: u.accountType,
        subscription: u.subscription,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("admin/users error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
