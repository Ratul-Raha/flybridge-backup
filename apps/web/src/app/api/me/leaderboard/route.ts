import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { computeMyRank } from "@/lib/leaderboard";

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await computeMyRank(session.userId, { periodDays: 7 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("me leaderboard GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
