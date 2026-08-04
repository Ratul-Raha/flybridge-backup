import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const [users, admins, moderators] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountType: "admin" }),
      User.countDocuments({ accountType: "moderator" }),
    ]);
    const free = await User.countDocuments({ subscription: "free" });
    const paid = await User.countDocuments({ subscription: "paid" });

    return NextResponse.json({
      stats: {
        users,
        free,
        paid,
        admins,
        moderators,
      },
    });
  } catch (error) {
    console.error("admin/stats error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
