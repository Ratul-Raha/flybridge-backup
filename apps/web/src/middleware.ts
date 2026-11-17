import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { requiresPhone } from "@/lib/phone-requirement";
import type { AccountType } from "@/lib/roles";

const EXEMPT_PATHS = new Set([
  "/login",
  "/logout",
  "/complete-profile",
  "/api/auth/google",
  "/api/auth/session",
  "/api/auth/phone",
  "/api/auth/logout",
]);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.next();

  let payload;
  try {
    ({ payload } = await jwtVerify(token, new TextEncoder().encode(secret)));
  } catch {
    return NextResponse.next();
  }

  const role = (payload.role as AccountType | undefined) ?? "user";
  const phone = (payload.phone as string | null | undefined) ?? null;
  if (!requiresPhone(role, phone)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (EXEMPT_PATHS.has(pathname)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "A phone number is required to continue." },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
