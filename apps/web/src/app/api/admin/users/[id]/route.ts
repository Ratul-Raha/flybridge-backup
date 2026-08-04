import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { ACCOUNT_TYPES, SUBSCRIPTION_TYPES } from "@/lib/roles";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.subscription && SUBSCRIPTION_TYPES.includes(body.subscription)) {
      user.subscription = body.subscription;
    }
    if (body.accountType && ACCOUNT_TYPES.includes(body.accountType)) {
      user.accountType = body.accountType;
    }

    await user.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/users PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
