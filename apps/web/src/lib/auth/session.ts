import "server-only";

import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { SignJWT, jwtVerify } from "jose";
import { connectDb } from "@/lib/db";
import type { AccountType, SubscriptionType } from "@/lib/roles";

/**
 * Tag used to invalidate every cached user snapshot. Profile/role writes call
 * `revalidateTag(USER_SNAPSHOT_TAG)` so edits show up immediately instead of
 * waiting for the TTL.
 */
export const USER_SNAPSHOT_TAG = "user-snapshot";

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
  phone?: string | null;
  address?: Record<string, string>;
  createdAt?: string;
  sessionId?: string;
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
    sessionId: user.sessionId ?? null,
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
    const base: SessionUser = {
      uid: payload.sub as string,
      userId: payload.userId as string | undefined,
      name: payload.name as string,
      email: payload.email as string,
      avatar: (payload.avatar as string | null) ?? null,
      role: payload.role as AccountType,
      subscription: payload.subscription as SubscriptionType,
      sessionId: (payload.sessionId as string | null) ?? undefined,
    };
    // Sessions older than the current schema have no sessionId and remain valid.
    if (base.userId && base.sessionId) {
      const { verifySession } = await import("@/lib/auth/sessions");
      try {
        const active = await verifySession(base.userId, base.sessionId);
        if (!active) return null;
      } catch {
        // Fail open on transient errors — don't log users out on DB hiccups.
      }
    }
    return await applyLiveUser(base);
  } catch {
    return null;
  }
}

export type UserSnapshot = {
  name: string;
  email: string;
  avatar?: string | null;
  accountType: AccountType;
  subscription: SubscriptionType;
  phone?: string | null;
  address?: Record<string, string>;
  createdAt: string;
};

/**
 * Minimal projection user lookup. readSession() enriches the cookie session
 * through this, so consumers of the session rarely need a second query.
 */
async function fetchUserSnapshot(userId: string): Promise<UserSnapshot | null> {
  await connectDb();
  const { User } = await import("@/lib/models/user");
  const user = await User.findById(userId)
    .select(
      "accountType subscription name email avatar phone address createdAt"
    )
    .lean<{
      name: string;
      email: string;
      avatar?: string | null;
      accountType: AccountType;
      subscription: SubscriptionType;
      phone?: string | null;
      address?: Record<string, string>;
      createdAt: Date;
    } | null>();
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    accountType: user.accountType,
    subscription: user.subscription,
    phone: user.phone ?? null,
    address: user.address,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * readSession() runs on nearly every dynamic request, so the user lookup is
 * cached for a short window (keyed by userId) to keep it from hitting Mongo on
 * every call. Profile/role writes invalidate `USER_SNAPSHOT_TAG`.
 */
export const getUserSnapshot = unstable_cache(
  fetchUserSnapshot,
  ["user-snapshot"],
  { revalidate: 30, tags: [USER_SNAPSHOT_TAG] }
);

async function applyLiveUser(session: SessionUser): Promise<SessionUser | null> {
  if (!session.userId) return session;
  try {
    const user = await getUserSnapshot(session.userId);
    if (!user) return null;
    return {
      ...session,
      name: user.name ?? session.name,
      email: user.email ?? session.email,
      avatar: user.avatar ?? session.avatar,
      role: user.accountType as AccountType,
      subscription: user.subscription as SubscriptionType,
      phone: user.phone ?? null,
      address: user.address,
      createdAt: user.createdAt,
    };
  } catch {
    return session;
  }
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}
