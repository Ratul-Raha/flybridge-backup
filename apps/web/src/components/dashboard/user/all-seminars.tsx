"use client";

import { useCallback, useEffect, useState } from "react";
import { SeminarCard } from "./seminar-card";
import { ScreenError, ScreenLoading } from "./ui";
import type { DashboardSeminar } from "./seminar-types";

export function AllSeminars() {
  const [seminars, setSeminars] = useState<DashboardSeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/seminars", { cache: "no-store" });
      const data = await res.json();
      setSeminars(data.seminars ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load seminars");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ScreenLoading label="Loading seminars…" />;
  if (error) return <ScreenError message={error} />;

  const now = new Date();
  const upcoming = seminars.filter((s) => new Date(s.dateTime) >= now);
  const recent = seminars.filter((s) => new Date(s.dateTime) < now);

  const renderSection = (title: string, subtitle: string, items: DashboardSeminar[]) => (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
          {title}
        </h2>
        <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
          {subtitle}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-[13.5px] py-8" style={{ color: "var(--body)" }}>
          Nothing here yet.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {items.map((s) => (
            <SeminarCard key={s.id} seminar={s} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-9">
      {seminars.length === 0 ? (
        <p className="text-[14px] py-12 text-center" style={{ color: "var(--body)" }}>
          No seminars right now. Check back soon!
        </p>
      ) : (
        <>
          {renderSection(
            "Upcoming seminars",
            "Book your spot before the seats fill up.",
            upcoming
          )}
          {renderSection(
            "Recent seminars",
            "Past sessions — see what was covered.",
            recent
          )}
        </>
      )}
    </div>
  );
}
