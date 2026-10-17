"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  DIAL_CODES,
  buildPhone,
  findCountryByIso,
  getDefaultCountry,
  splitPhone,
  type DialCode,
} from "@/lib/phone";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  borderColor?: string;
  textColor?: string;
};

export function PhoneInput({
  value,
  onChange,
  defaultCountry,
  placeholder = "Phone number",
  disabled,
  id,
  className,
  inputClassName,
  inputStyle,
  borderColor = "var(--line)",
  textColor = "var(--ink)",
}: PhoneInputProps) {
  const fallbackIso = defaultCountry ?? getDefaultCountry().code;

  const [iso, setIso] = useState<string>(
    () => splitPhone(value).country?.code ?? fallbackIso
  );
  const [national, setNational] = useState<string>(() => splitPhone(value).national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>(value ?? "");

  const country: DialCode = findCountryByIso(iso) ?? getDefaultCountry();

  useEffect(() => {
    if (value === lastEmitted.current) return;
    const parsed = splitPhone(value);
    if (parsed.country) setIso(parsed.country.code);
    setNational(parsed.national);
    lastEmitted.current = value ?? "";
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DIAL_CODES;
    return DIAL_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/^\+/, ""))
    );
  }, [query]);

  const commit = (nextIso: string, nextNational: string) => {
    const c = findCountryByIso(nextIso) ?? getDefaultCountry();
    const next = buildPhone(nextNational, c.dial);
    lastEmitted.current = next;
    onChange(next);
  };

  const handleCountry = (code: string) => {
    setIso(code);
    setOpen(false);
    setQuery("");
    commit(code, national);
  };

  const handleNational = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    setNational(digits);
    commit(iso, digits);
  };

  return (
    <div ref={wrapperRef} className={`relative flex ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-l-xl border border-r-0 px-3 text-[13px] font-medium transition-colors duration-200 disabled:opacity-60"
        style={{ borderColor, color: textColor, background: "var(--bg-soft)" }}
        aria-label="Select country code"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`fi fi-${country.code.toLowerCase()} rounded-sm`} />
        <span style={{ color: "var(--body)" }}>+{country.dial}</span>
        <ChevronDown size={14} style={{ color: "var(--body)" }} />
      </button>

      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={national}
        disabled={disabled}
        onChange={(e) => handleNational(e.target.value)}
        placeholder={placeholder}
        className={
          (inputClassName ??
            "w-full border px-4 py-[11px] text-[14px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60") +
          " rounded-r-xl !rounded-l-none"
        }
        style={{ borderColor, color: textColor, ...inputStyle }}
      />

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-30 w-[320px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border bg-white shadow-lg"
          style={{ borderColor: "var(--line)" }}
          role="listbox"
        >
          <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--line)" }}>
            <Search size={15} style={{ color: "var(--body)" }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country"
              className="w-full bg-transparent text-[13px] focus:outline-none"
              style={{ color: "var(--ink)" }}
            />
          </div>
          <ul className="max-h-[260px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-[13px]" style={{ color: "var(--body)" }}>
                No match
              </li>
            )}
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => handleCountry(c.code)}
                  className="flex w-full items-center gap-3 px-3 py-[7px] text-left text-[13px] transition-colors hover:bg-[var(--bg-soft)]"
                  style={{ color: "var(--ink)" }}
                  role="option"
                  aria-selected={c.code === country.code}
                >
                  <span className={`fi fi-${c.code.toLowerCase()} rounded-sm`} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span style={{ color: "var(--body)" }}>+{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
