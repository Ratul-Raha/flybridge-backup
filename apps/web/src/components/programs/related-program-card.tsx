import Link from "next/link";
import { BengaliText } from "../bengali-text";

export type RelatedProgram = {
  slug: string;
  title: string;
  badge: string;
  badgeColor: string;
  bg: string;
  sub: string;
  image?: string | null;
};

export function RelatedProgramCard({ p }: { p: RelatedProgram }) {
  return (
    <Link
      href={`/programs/${p.slug}`}
      className="fb-card fb-reveal group flex flex-col overflow-hidden rounded-[14px] border bg-white"
      style={{ borderColor: "var(--line)" }}
    >
      <span
        className="relative flex h-[136px] items-center justify-center overflow-hidden"
        style={{ background: p.bg }}
      >
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt={p.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <span
            className="px-4 text-center font-mono text-[12px] font-bold leading-snug tracking-[0.14em]"
            style={{ color: p.badgeColor }}
          >
            {p.badge}
          </span>
        )}
        <span
          className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 font-mono text-[9px] font-bold tracking-[0.22em]"
          style={{ color: p.badgeColor }}
        >
          {p.badge.toUpperCase()}
        </span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col p-5">
        <span
          className="block font-display text-[15px] font-semibold leading-[1.3] text-balance"
          style={{ color: "var(--ink)" }}
        >
          <BengaliText>{p.title}</BengaliText>
        </span>
        <span className="mt-1.5 block truncate text-[12.5px]" style={{ color: "var(--body)" }}>
          <BengaliText>{p.sub}</BengaliText>
        </span>
        <span
          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          style={{ color: "var(--brand-2)" }}
        >
          <BengaliText>বিস্তারিত দেখো</BengaliText>
          <svg
            className="h-[13px] w-[13px] transition-transform duration-200 group-hover:translate-x-[3px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12H19M19 12L13 6M19 12L13 18" />
          </svg>
        </span>
      </span>
    </Link>
  );
}
