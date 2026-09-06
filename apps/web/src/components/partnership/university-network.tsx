"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

type University = {
  name: string;
  location: string;
  country: string;
  flagCode: string;
  region: "USA" | "Canada" | "UK" | "Australia" | "NZ";
};

const REGION_LABEL: Record<University["region"], string> = {
  USA: "USA",
  Canada: "Canada",
  UK: "UK",
  Australia: "Australia",
  NZ: "New Zealand",
};

const universities: University[] = [
  // ── USA ───────────────────────────────────────────────────────
  { name: "Arizona State University", location: "Tempe, AZ", country: "United States", flagCode: "us", region: "USA" },
  { name: "Southern New Hampshire University", location: "Manchester, NH", country: "United States", flagCode: "us", region: "USA" },
  { name: "University of Central Oklahoma", location: "Edmond, OK", country: "United States", flagCode: "us", region: "USA" },

  // ── Canada ────────────────────────────────────────────────────
  { name: "Western University", location: "London, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Lakehead University", location: "Thunder Bay, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Laurentian University", location: "Sudbury, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Brock University", location: "St. Catharines, ON", country: "Canada", flagCode: "ca", region: "Canada" },
  { name: "Yorkville University", location: "Toronto, ON", country: "Canada", flagCode: "ca", region: "Canada" },

  // ── UK ────────────────────────────────────────────────────────
  { name: "University of Edinburgh", location: "Edinburgh", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Southampton", location: "Southampton", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Birmingham", location: "Birmingham", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Bristol", location: "Bristol", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Glasgow", location: "Glasgow", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Warwick", location: "Coventry", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Manchester", location: "Manchester", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "Cardiff University", location: "Cardiff", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "Durham University", location: "Durham", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Reading", location: "Reading", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "Coventry University", location: "Coventry", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "Northumbria University", location: "Newcastle upon Tyne", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "Bournemouth University", location: "Bournemouth", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Greenwich", location: "London", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Hertfordshire", location: "Hatfield", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "University of Chester", location: "Chester", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "Edinburgh Napier University", location: "Edinburgh", country: "United Kingdom", flagCode: "gb", region: "UK" },
  { name: "Swansea University", location: "Swansea", country: "United Kingdom", flagCode: "gb", region: "UK" },

  // ── Australia ─────────────────────────────────────────────────
  { name: "Australian National University", location: "Canberra", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "UNSW Sydney", location: "Sydney", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "University of Western Australia", location: "Perth", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "University of Technology Sydney", location: "Sydney", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Macquarie University", location: "Sydney", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Queensland University of Technology", location: "Brisbane", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Curtin University", location: "Perth", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Bond University", location: "Gold Coast", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Deakin University", location: "Melbourne", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Griffith University", location: "Brisbane", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "La Trobe University", location: "Melbourne", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "University of Wollongong", location: "Wollongong", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "University of Canberra", location: "Canberra", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Charles Sturt University", location: "Bathurst, NSW", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Victoria University", location: "Melbourne", country: "Australia", flagCode: "au", region: "Australia" },
  { name: "Edith Cowan University", location: "Perth", country: "Australia", flagCode: "au", region: "Australia" },

  // ── New Zealand ───────────────────────────────────────────────
  { name: "Auckland University of Technology", location: "Auckland", country: "New Zealand", flagCode: "nz", region: "NZ" },
  { name: "Massey University", location: "Palmerston North", country: "New Zealand", flagCode: "nz", region: "NZ" },
  { name: "University of Canterbury", location: "Christchurch", country: "New Zealand", flagCode: "nz", region: "NZ" },
  { name: "Victoria University of Wellington", location: "Wellington", country: "New Zealand", flagCode: "nz", region: "NZ" },
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
              Partner universities across the US, Canada, UK, Australia &amp; New Zealand
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