"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ResourceList, ResourceRow, type ResourceCardData } from "./resource-card";
import { EmptyState, ScreenError, ScreenLoading } from "./ui";

export function MyResources() {
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/resources?mine=true", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load your resources");
      const data = await res.json();
      setResources(data.resources ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ScreenLoading label="Loading your resources…" />;
  if (error) return <ScreenError message={error} />;

  if (resources.length === 0) {
    return (
      <EmptyState
        title="You don't have any member resources yet"
        desc="Member-exclusive guides, templates and toolkits will appear here once published."
        action={
          <Link
            href="/dashboard/resources"
            className="inline-block rounded-full text-white text-[13.5px] font-semibold px-6 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            Browse all resources
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
            Your resources
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Member-only resources unlocked for you.
          </p>
        </div>
        <ResourceList>
          {resources.map((r) => (
            <ResourceRow key={r.id} resource={r} unlocked />
          ))}
        </ResourceList>
      </section>
    </div>
  );
}
