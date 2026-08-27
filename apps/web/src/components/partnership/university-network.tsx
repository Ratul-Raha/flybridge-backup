"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

type University = {
  name: string;
  location: string;
  country: string;
  flagCode: string;
  region: "USA" | "Canada" | "Europe";
};

const REGION_LABEL: Record<University["region"], string> = {
  USA: "USA",
  Canada: "Canada",
  Europe: "Europe",
};

const universities: University[] = [
  { name: "Arizona State University", location: "Tempe, AZ", country: "United States", flagCode: "us", region: "USA" },
  { name: "Northeastern University", location: "Boston, MA", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Massachusetts Boston", location: "Boston, MA", country: "United States", flagCode: "us", region: "USA" },
  { name: "Boston University", location: "Boston, MA", country: "United States", flagCode: "us", region: "USA" },
  { name: "New York University", location: "New York, NY", country: "United States", flagCode: "us", region: "USA" },
  { name: "Columbia University", location: "New York, NY", country: "United States", flagCode: "us", region: "USA" },
  { name: "Emory University", location: "Atlanta, GA", country: "United States", flagCode: "us", region: "USA" },
  { name: "Illinois Institute of Technology", location: "Chicago, IL", country: "United States", flagCode: "us", region: "USA" },
  { name: "University at Buffalo", location: "Buffalo, NY", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of California, Los Angeles", location: "Los Angeles, CA", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Southern California", location: "Los Angeles, CA", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Michigan", location: "Ann Arbor, MI", country: "United States", flagCode: "us", region: "USA" },
  { name: "Michigan State University", location: "East Lansing, MI", country: "United States", flagCode: "us", region: "USA" },
  { name: "Purdue University", location: "West Lafayette, IN", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Illinois Urbana-Champaign", location: "Urbana, IL", country: "United States", flagCode: "us", region: "USA" },
  { name: "Ohio State University", location: "Columbus, OH", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Florida", location: "Gainesville, FL", country: "United States", flagCode: "us", region: "USA" },
  { name: "Georgia Institute of Technology", location: "Atlanta, GA", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Washington", location: "Seattle, WA", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Maryland", location: "College Park, MD", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Texas at Austin", location: "Austin, TX", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Toronto", location: "Toronto, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "York University", location: "Toronto, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "University of British Columbia", location: "Vancouver, BC", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Simon Fraser University", location: "Burnaby, BC", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "University of Victoria", location: "Victoria, BC", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "McGill University", location: "Montreal, QC", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Concordia University", location: "Montreal, QC", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "McMaster University", location: "Hamilton, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "University of Waterloo", location: "Waterloo, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Western University", location: "London, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Queen's University", location: "Kingston, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "University of Ottawa", location: "Ottawa, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "University of Alberta", location: "Edmonton, AB", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "University of Calgary", location: "Calgary, AB", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Dalhousie University", location: "Halifax, NS", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "University of Oxford", location: "Oxford", country: "United Kingdom", flagCode: "gb", region: "Europe" },
  { name: "University of Cambridge", location: "Cambridge", country: "United Kingdom", flagCode: "gb", region: "Europe" },
  { name: "Imperial College London", location: "London", country: "United Kingdom", flagCode: "gb", region: "Europe" },
  { name: "University College London", location: "London", country: "United Kingdom", flagCode: "gb", region: "Europe" },
  { name: "University of Edinburgh", location: "Edinburgh", country: "United Kingdom", flagCode: "gb", region: "Europe" },
  { name: "Technical University of Munich", location: "Munich", country: "Germany", flagCode: "de", region: "Europe" },
  { name: "Ludwig Maximilian University of Munich", location: "Munich", country: "Germany", flagCode: "de", region: "Europe" },
  { name: "University of Amsterdam", location: "Amsterdam", country: "Netherlands", flagCode: "nl", region: "Europe" },
  { name: "Delft University of Technology", location: "Delft", country: "Netherlands", flagCode: "nl", region: "Europe" },
  { name: "Trinity College Dublin", location: "Dublin", country: "Ireland", flagCode: "ie", region: "Europe" },
  { name: "Sciences Po", location: "Paris", country: "France", flagCode: "fr", region: "Europe" },
  { name: "ETH Zurich", location: "Zurich", country: "Switzerland", flagCode: "ch", region: "Europe" },
  { name: "University of Vienna", location: "Vienna", country: "Austria", flagCode: "at", region: "Europe" },
  { name: "University of Copenhagen", location: "Copenhagen", country: "Denmark", flagCode: "dk", region: "Europe" },
  { name: "University of Helsinki", location: "Helsinki", country: "Finland", flagCode: "fi", region: "Europe" },
  { name: "Karolinska Institute", location: "Stockholm", country: "Sweden", flagCode: "se", region: "Europe" },
];

export function UniversityNetwork() {
  const [query, setQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<University["region"] | null>(null);
  const q = query.trim().toLowerCase();

  const results = useMemo(
    () =>
      universities
        .filter((u) => (activeRegion ? u.region === activeRegion : true))
        .filter(
          (u) =>
            !q ||
            u.name.toLowerCase().includes(q) ||
            u.location.toLowerCase().includes(q) ||
            u.country.toLowerCase().includes(q) ||
            REGION_LABEL[u.region].toLowerCase().includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [q, activeRegion]
  );

  const regionCounts = useMemo(() => {
    const counts = new Map<University["region"], number>();
    for (const u of universities) {
      counts.set(u.region, (counts.get(u.region) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, []);

  return (
    <section id="universities" className="px-[clamp(20px,4.5vw,56px)] pt-[64px] pb-[80px]">
      <div className="max-w-[1320px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
          <div>
            <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
              UNIVERSITY NETWORK
            </div>
            <h2
              className="font-display font-semibold tracking-[-0.01em] max-w-[620px]"
              style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
            >
              Partner universities across the US, Canada &amp; Europe
            </h2>
          </div>
          <p className="text-[15px] max-w-[380px]" style={{ color: "var(--body)" }}>
            From research powerhouses to career-focused institutions, our partner universities give
            students real, credible pathways into global higher education.
          </p>
        </div>

        {/* Search */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[440px]">
            <Search size={16} className="absolute left-[16px] top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by university, location or country…"
              className="w-full rounded-lg border bg-white pl-11 pr-11 py-[12px] text-[14px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
              style={{ borderColor: "var(--line)", color: "var(--ink)", boxShadow: "0 14px 30px -24px rgba(18,32,67,0.3)" }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-[12px] top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[var(--bg-soft)]"
                style={{ color: "var(--body)" }}
              >
                <X size={13} />
              </button>
            )}
          </div>
          {q && (
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.25em]" style={{ color: "var(--brand-2)" }}>
              {results.length} {results.length === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        {/* Meta */}
        {!q && (
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setActiveRegion(null)}
              className="cursor-pointer font-mono text-[10.5px] font-semibold uppercase tracking-[0.25em] transition-colors duration-150 hover:opacity-70"
              style={{ color: activeRegion ? "var(--body)" : "var(--brand-2)" }}
            >
              {universities.length} partner universities
            </button>
            {regionCounts.map(([region, count]) => {
              const active = activeRegion === region;
              return (
                <span key={region} className="flex items-center gap-x-3">
                  <span className="h-1 w-1 rounded-full" style={{ background: "var(--line)" }} />
                  <button
                    type="button"
                    onClick={() => setActiveRegion(active ? null : region)}
                    className="cursor-pointer text-[12.5px] transition-colors duration-150 hover:opacity-70"
                    style={{ color: active ? "var(--brand-2)" : "var(--body)" }}
                  >
                    {count} in{" "}
                    <span className="font-semibold" style={{ color: active ? "var(--brand-2)" : "var(--ink)" }}>
                      {REGION_LABEL[region]}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Attached grid */}
        {results.length === 0 ? (
          <div className="rounded-lg border border-line bg-white px-6 py-20 text-center" style={{ boxShadow: "0 24px 50px -34px rgba(18,32,67,0.22)" }}>
            <div className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
              No universities match “{query.trim()}”
            </div>
            <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
              Try a name like “Toronto”, a location like “London”, or clear the search.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{ background: "var(--line)", boxShadow: "0 24px 50px -34px rgba(18,32,67,0.22)" }}
          >
            {results.map((u) => (
              <div
                key={u.name}
                className="group flex min-w-0 items-center gap-3 bg-white px-4 py-4 transition-colors duration-200 hover:bg-[var(--brand-soft)]/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/flags/${u.flagCode}.svg`}
                  alt={`${u.country} flag`}
                  className="h-3.5 w-[22px] shrink-0 rounded-[2px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    {u.name}
                  </div>
                  <div className="mt-[2px] truncate text-[11.5px]" style={{ color: "var(--body)" }}>
                    {u.location} <span className="opacity-50">·</span> {u.country}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}