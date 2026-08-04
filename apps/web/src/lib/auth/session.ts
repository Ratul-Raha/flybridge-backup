import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { AccountType, SubscriptionType } from "@/lib/roles";

export const SESSION_COOKIE = "flybridge_session";
const SESSION_DURATION = 60 * 60 * 24 * 30;

export type SessionUser = {
  uid: string;
  userId?: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: AccountType;
  subscription: SubscriptionType;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    role: user.role,
    subscription: user.subscription,
    userId: user.userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

export async function readSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      uid: payload.sub as string,
      userId: payload.userId as string | undefined,
      name: payload.name as string,
      email: payload.email as string,
      avatar: (payload.avatar as string | null) ?? null,
      role: payload.role as AccountType,
      subscription: payload.subscription as SubscriptionType,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}
