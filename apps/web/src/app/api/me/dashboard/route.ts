import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/dashboard/user";

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getUserDashboardData(session.userId, session.email);
    return NextResponse.json(data);
  } catch (error) {
    console.error("me dashboard GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
