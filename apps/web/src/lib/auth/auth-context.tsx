"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Auth } from "firebase/auth";
import type { AccountType, SubscriptionType } from "@/lib/roles";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  address?: Record<string, string>;
  accountType: AccountType;
  subscription: SubscriptionType;
  createdAt?: string;
};

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: (source?: string | null) => Promise<string | null>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
  };
const SIGNUP_SOURCE_KEY = "flybridge_signup_source";

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Firebase is only needed for Google sign-in flows; the cookie session is the
 * source of truth for auth state. Loading the firebase/auth bundle lazily
 * keeps it (and its chunk) off the critical path of every page render.
 */
async function loadFirebase(): Promise<{
  auth: Auth | undefined;
  fb: typeof import("firebase/auth");
}> {
  const [fb, app] = await Promise.all([
    import("firebase/auth"),
    import("@/lib/firebase"),
  ]);
  return { fb, auth: app.auth };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch (e) {
      console.error("refreshSession error", e);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    loadFirebase().then(({ auth, fb }) => {
      if (!auth || cancelled) return;
      unsubscribe = fb.onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) refreshSession();
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [refreshSession]);

  const pendingSourceRef = useRef<string | null>(null);

  const exchangeToken = useCallback(
    async (idToken: string, source: string | null): Promise<string | null> => {
      setError(null);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, source }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Sign-in failed (HTTP ${res.status})`);
        }
        const data = await res.json();
        await refreshSession();
        return data?.user?.email ?? null;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed");
        return null;
      }
    },
    [refreshSession]
  );

  const signInWithGoogle = useCallback(
    async (source?: string | null): Promise<string | null> => {
      setError(null);
      pendingSourceRef.current = source ?? null;
      const { auth, fb } = await loadFirebase();
      if (!auth) {
        setError("Firebase is not configured. Add your Firebase config to apps/web/.env.local");
        return null;
      }
      try {
        const provider = new fb.GoogleAuthProvider();
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (clientId && !clientId.startsWith("replace-me")) {
          provider.setCustomParameters({ client_id: clientId });
        }
        const credential = await fb.signInWithPopup(auth, provider);
        const idToken = await credential.user.getIdToken();
        return exchangeToken(idToken, source ?? null);
      } catch (e) {
        const code = (e as { code?: string })?.code ?? "";
        if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
          // Redirects reload the page, so the source must survive in sessionStorage
          // (the ref is reset on remount). getRedirectResult clears it afterwards.
          if (source) sessionStorage.setItem(SIGNUP_SOURCE_KEY, source);
          await fb.signInWithRedirect(auth, new fb.GoogleAuthProvider());
          return null;
        }
        setError(e instanceof Error ? e.message : "Sign-in failed");
        return null;
      }
    },
    [exchangeToken]
  );

  useEffect(() => {
    let cancelled = false;
    loadFirebase().then(({ auth, fb }) => {
      if (!auth || cancelled) return;
      fb.getRedirectResult(auth)
        .then(async (result) => {
          if (cancelled || !result?.user) return;
          const stored = sessionStorage.getItem(SIGNUP_SOURCE_KEY);
          const source = stored ?? pendingSourceRef.current;
          sessionStorage.removeItem(SIGNUP_SOURCE_KEY);
          pendingSourceRef.current = null;
          const idToken = await result.user.getIdToken();
          exchangeToken(idToken, source);
        })
        .catch((e) => {
          const code = (e as { code?: string })?.code ?? "";
          if (code !== "auth/credential-already-in-use" && code !== "auth/operation-not-supported-in-this-environment") {
            setError(e instanceof Error ? e.message : "Sign-in failed");
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [exchangeToken]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { auth, fb } = await loadFirebase();
      if (auth) {
        await fb.signOut(auth);
      }
    } catch {
      // ignore firebase signout errors, still clear local session
    }
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, signInWithGoogle, signOut, refreshSession }),
    [user, loading, error, signInWithGoogle, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
