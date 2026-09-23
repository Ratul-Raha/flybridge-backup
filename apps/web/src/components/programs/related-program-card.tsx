import Link from "next/link";
import Image from "next/image";
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
      className="group flex items-center gap-3.5 rounded-xl border bg-white p-3 transition-all duration-200 hover:shadow-[0_16px_32px_-20px_rgba(18,32,67,0.5)]"
      style={{ borderColor: "var(--line)" }}
    >
      <span
        className="w-[60px] h-[60px] rounded-lg overflow-hidden flex items-center justify-center shrink-0"
        style={{ background: p.bg }}
      >
        {p.image ? (
          <Image src={p.image} alt={p.title} width={120} height={120} sizes="60px" className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-mono text-[10px] font-bold tracking-[0.1em] px-2 text-center leading-snug"
            style={{ color: p.badgeColor }}
          >
            {p.badge}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="font-mono text-[9.5px] font-semibold tracking-[0.3em] block"
          style={{ color: p.badgeColor }}
        >
          {p.badge.toUpperCase()}
        </span>
        <span
          className="block font-display text-[13.5px] font-semibold leading-[1.3] line-clamp-2 mt-[3px]"
          style={{ color: "var(--ink)" }}
        >
          <BengaliText>{p.title}</BengaliText>
        </span>
        <span className="block text-[11px] mt-[3px] truncate" style={{ color: "var(--body)" }}>
          {p.sub}
        </span>
      </span>

      <svg
        className="w-[14px] h-[14px] shrink-0 transition-transform duration-200 group-hover:translate-x-[3px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--body)" }}
      >
        <path d="M5 12H19M19 12L13 6M19 12L13 18" />
      </svg>
    </Link>
  );
}