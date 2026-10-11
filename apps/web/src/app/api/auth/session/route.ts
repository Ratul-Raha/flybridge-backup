import { NextResponse } from "next/server";
import { readSession, getUserSnapshot } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  let phone: string | null = session.phone ?? null;
  let address: Record<string, string> = session.address ?? {};
  let createdAt: string | undefined = session.createdAt;

  // SessionUser lacks phone/address/createdAt only for legacy tokens created
  // before those fields were added (readSession already applied the live user
  // snapshot when it could, so this lookup rarely fires).
  if (!createdAt && session.userId) {
    const snapshot = await getUserSnapshot(session.userId).catch(() => null);
    if (snapshot) {
      phone = snapshot.phone ?? null;
      address = snapshot.address ?? {};
      createdAt = snapshot.createdAt;
    }
  }

  return NextResponse.json({
    user: {
      id: session.userId ?? session.uid,
      name: session.name,
      email: session.email,
      phone,
      avatar: session.avatar ?? null,
      address,
      accountType: session.role,
      subscription: session.subscription,
      createdAt,
    },
  });
}
