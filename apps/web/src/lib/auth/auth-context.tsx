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
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
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
const AuthContext = createContext<AuthContextValue | null>(null);

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
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) refreshSession();
    });
    return unsubscribe;
  }, [refreshSession]);

  const pendingSourceRef = useRef<string | null>(null);

  const exchangeToken = useCallback(
    async (idToken: string): Promise<string | null> => {
      setError(null);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, source: pendingSourceRef.current }),
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
      if (!auth) {
        setError("Firebase is not configured. Add your Firebase config to apps/web/.env.local");
        return null;
      }
      try {
        const provider = new GoogleAuthProvider();
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (clientId && !clientId.startsWith("replace-me")) {
          provider.setCustomParameters({ client_id: clientId });
        }
        const credential = await signInWithPopup(auth, provider);
        const idToken = await credential.user.getIdToken();
        return exchangeToken(idToken);
      } catch (e) {
        const code = (e as { code?: string })?.code ?? "";
        if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
          pendingSourceRef.current = source ?? null;
          await signInWithRedirect(auth, new GoogleAuthProvider());
          return null;
        }
        setError(e instanceof Error ? e.message : "Sign-in failed");
        return null;
      }
    },
    [exchangeToken]
  );

  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    getRedirectResult(auth)
      .then(async (result) => {
        if (cancelled || !result?.user) return;
        const idToken = await result.user.getIdToken();
        exchangeToken(idToken);
      })
      .catch((e) => {
        const code = (e as { code?: string })?.code ?? "";
        if (code !== "auth/credential-already-in-use" && code !== "auth/operation-not-supported-in-this-environment") {
          setError(e instanceof Error ? e.message : "Sign-in failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth, exchangeToken]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      if (auth) await firebaseSignOut(auth);
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
