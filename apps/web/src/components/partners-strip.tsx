import { GraduationCap } from "lucide-react";

const stats = [
  { value: "40+", label: "University Partners" },
  { value: "12+", label: "Countries" },
  { value: "14", label: "Years of Expertise" },
];

export function PartnersStrip() {
  return (
    <section
      className="relative overflow-hidden border-y border-white/[0.06]"
      style={{ background: "var(--ink)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(780px 180px at 8% -40%, rgba(20,181,126,0.14), transparent 70%)",
        }}
      />
      <div className="relative max-w-[1320px] mx-auto px-[clamp(20px,4.5vw,56px)] py-[22px] md:py-[26px]">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="w-[8px] h-[8px] rounded-full shrink-0"
              style={{
                background: "var(--brand-2)",
                boxShadow: "0 0 0 4px rgba(20,181,126,0.18)",
              }}
            />
            <span className="font-mono text-[10px] font-medium tracking-[0.3em] uppercase leading-none text-white/90">
              Trusted partners
            </span>
          </div>

          <div className="grid grid-cols-3 w-full sm:flex sm:items-center sm:w-auto">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`px-2 sm:px-7 sm:first:pl-0 ${
                  i < stats.length - 1 ? "border-r border-white/10" : ""
                }`}
              >
                <div className="font-display text-[19px] sm:text-[24px] font-bold leading-none tracking-[-0.02em] text-white">
                  {stat.value}
                </div>
                <div className="mt-[6px] text-[9px] sm:text-[11px] leading-none text-white/55 whitespace-nowrap">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-[9px]">
            <GraduationCap
              size={14}
              strokeWidth={1.75}
              className="shrink-0"
              style={{ color: "var(--brand-2)" }}
            />
            <span className="text-[10px] sm:text-[11px] leading-none text-white/65">
              English Language, Student Visa Guidance &amp; Global Education
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
