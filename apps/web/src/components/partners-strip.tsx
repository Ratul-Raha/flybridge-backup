const partners = [
  "IDP Education",
  "British Council",
  "Arizona State University",
  "Southern New Hampshire University",
  "University of Central Oklahoma",
  "Western University",
  "Lakehead University",
  "Laurentian University",
  "Brock University",
  "Yorkville University",
  "University of Edinburgh",
  "University of Bristol",
  "University of Glasgow",
  "University of Warwick",
  "University of Manchester",
  "Cardiff University",
  "Durham University",
  "University of Southampton",
  "University of Birmingham",
  "Edinburgh Napier University",
  "Swansea University",
  "Australian National University",
  "UNSW Sydney",
  "University of Western Australia",
  "University of Technology Sydney",
  "Macquarie University",
  "Queensland University of Technology",
  "Curtin University",
  "Bond University",
  "Deakin University",
  "Griffith University",
  "La Trobe University",
  "Auckland University of Technology",
  "Massey University",
  "University of Canterbury",
  "Victoria University of Wellington",
];

export function PartnersStrip() {
  return (
    <section className="relative overflow-hidden pt-[10px] pb-[12px] md:py-[18px]" style={{ background: "var(--ink)" }}>
      <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row md:items-center gap-3.5 md:gap-8 px-[clamp(20px,4.5vw,56px)]">
        <div className="flex items-center gap-3 shrink-0">
          <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: "var(--brand-2)", boxShadow: "0 0 0 4px rgba(20,181,126,0.18)" }} />
          <div>
            <div className="font-mono text-[10px] font-medium tracking-[0.3em] uppercase leading-none text-white/90">
              Trusted partners
            </div>
            <div className="text-[11px] mt-[3px] leading-none text-white/50">
              40+ institutions, 12+ countries
            </div>
          </div>
        </div>

        <span className="hidden md:block w-px h-8 shrink-0" style={{ background: "rgba(255,255,255,0.14)" }} />

        <div className="fb-marquee flex items-center w-full overflow-hidden min-w-0" style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
          <div className="fb-marquee-track flex items-center gap-[12px] pr-[12px] shrink-0">
            {[...partners, ...partners].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-[8px] sm:px-[18px] sm:py-[9px] whitespace-nowrap"
              >
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                <span className="text-[12px] sm:text-[13px] font-medium leading-none text-white/85">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}