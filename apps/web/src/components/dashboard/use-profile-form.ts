"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export const ADDRESS_FIELDS = [
  { key: "street", label: "Street address", placeholder: "123 Main Street" },
  { key: "city", label: "City", placeholder: "Lagos" },
  { key: "state", label: "State / Region", placeholder: "Lagos" },
  { key: "country", label: "Country", placeholder: "Nigeria" },
  { key: "postalCode", label: "Postal code", placeholder: "100001" },
] as const;

export type ProfileForm = {
  name: string;
  phone: string;
  avatar: string;
  address: Record<string, string>;
};

export function useProfileForm() {
  const { user, loading, refreshSession } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    avatar: "",
    address: {},
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        avatar: user.avatar ?? "",
        address: user.address ?? {},
      });
    }
  }, [user]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      await refreshSession();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return { user, loading, form, setForm, saved, saving, error, save };
}