import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS_URI =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const jwks = createRemoteJWKSet(new URL(JWKS_URI));

export type GoogleClaims = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  phone_number?: string;
};

export async function verifyIdToken(idToken: string): Promise<GoogleClaims> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || projectId.startsWith("replace-me")) {
    throw new Error("FIREBASE_PROJECT_ID not configured");
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  return {
    uid: payload.sub as string,
    email: payload.email as string | undefined,
    email_verified: payload.email_verified as boolean | undefined,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
    phone_number: payload.phone_number as string | undefined,
  };
}
