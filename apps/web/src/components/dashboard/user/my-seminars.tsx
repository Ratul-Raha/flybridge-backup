"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SeminarCard } from "./seminar-card";
import { EmptyState, ScreenError, ScreenLoading } from "./ui";
import type { DashboardSeminar } from "./seminar-types";

export function MySeminars() {
  const [seminars, setSeminars] = useState<DashboardSeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me/seminars", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load your seminars");
      const data = await res.json();
      setSeminars(data.seminars ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your seminars");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ScreenLoading label="Loading your seminars…" />;
  if (error) return <ScreenError message={error} />;

  if (seminars.length === 0) {
    return (
      <EmptyState
        title="You haven't registered for any seminars yet"
        desc="Register for a seminar to get live guidance on studying, working and building a career abroad."
        action={
          <Link
            href="/dashboard/seminars"
            className="inline-block rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            Browse all seminars
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-9">
      <section>
        <div className="mb-4">
          <h2 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
            Your registrations
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Seminars you've registered for, and their current status.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {seminars.map((s) => (
            <SeminarCard key={s.id} seminar={s} registered />
          ))}
        </div>
      </section>
    </div>
  );
}
