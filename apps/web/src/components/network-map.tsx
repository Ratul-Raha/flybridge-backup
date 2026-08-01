const land: Record<string, string> = {
  us: "M153.6,115.5 L159.7,145 L171.4,155.5 L174.4,159.2 L204.2,161.7 L230.3,177.8 L273.9,180.3 L273.6,165.5 L290.3,152.2 L294.4,137 L313.9,125 L280.6,129.2 L269.4,123.6 L244.4,120 L159.7,115.8 Z",
  ca: "M108.3,83.3 L194.4,50 L250,69.4 L338.9,97.2 L352.8,119.4 L333.3,125 L313.9,125 L305.6,116.7 L295,124 L279,130.5 L266.7,122.2 L250,115.3 L208.3,100 L166.7,102.8 L155.6,112.5 Z",
  eu: "M473.6,142.5 L488.9,150 L522.2,144.4 L547.2,138.9 L583.3,125 L584.7,109.7 L566.7,91.7 L577.8,55.6 L533.3,66.7 L513.9,88.9 L527.8,94.4 L552.8,105.6 L527.8,108.3 L513.9,106.9 L503.9,105.6 L486.1,101.4 L473.6,102.8 Z",
  sa: "M286.1,227.8 L327.8,222.2 L402.8,265.3 L380.6,313.9 L338.9,347.2 L319.4,394.4 L297.2,361.1 L277.8,277.8 Z",
  mx: "M174.4,159.2 L230.3,177.8 L252.8,211.1 L277.8,225 L247.2,202.8 L225,190 L200,170 Z",
  af: "M480.6,155.5 L452.8,209.7 L463.9,225 L516.7,237.5 L525,244.4 L533.3,263.9 L536.1,291.7 L541.7,316.7 L552.8,345.8 L597.2,305.6 L625,252.8 L641.7,220.8 L611.1,208.3 L588.9,163.9 L550,158.3 L527.8,147.2 L497.2,150 Z",
  as: "M577.8,138.9 L597.2,148.6 L611.1,158.3 L630.6,169.4 L638.9,180.6 L652.8,187.5 L661.1,191.7 L625,213.9 L686.1,180.6 L700,188.9 L701.4,216.7 L715.3,227.8 L722.2,194.4 L750,186.1 L769.4,202.8 L777.8,236.1 L791.7,216.7 L811.1,188.9 L827.8,161.1 L837.5,147.2 L838.9,138.9 L855.6,147.2 L861.1,125 L888.9,83.3 L944.4,69.4 L958.3,97.2 L1000,66.7 L750,41.7 L666.7,55.6 L611.1,69.4 L583.3,94.4 Z",
  au: "M813.9,311.1 L819.4,344.4 L883.3,347.2 L902.8,355.5 L919.4,344.4 L925,325 L895.8,279.2 L877.8,288.9 L861.1,283.3 Z",
  gl: "M350,50 L390,65 L395,85 L365,95 L345,80 Z",
  is: "M441.7,68.1 L452.8,64 L458.3,71 L450,75 Z",
};

const highlighted = ["us", "ca", "eu"];
const muted = ["sa", "mx", "af", "as", "au", "gl", "is"];

const hub = { x: 279.4, y: 128.6 };

const nodes = [
  { name: "Phoenix", x: 188.6, y: 156.9, count: 1 },
  { name: "Chicago", x: 256.7, y: 133.6, count: 1 },
  { name: "Boston", x: 302.5, y: 132.2, count: 2 },
  { name: "Buffalo", x: 286, y: 138, count: 1 },
  { name: "Vancouver", x: 157.5, y: 109.5, count: 3 },
  { name: "Montreal", x: 295.6, y: 123.6, count: 2 },
  { name: "Toronto", x: 279.4, y: 128.6, count: 3, hub: true },
  { name: "London", x: 499, y: 101.6, count: 2, strategic: true },
];

const reachDots = [
  { name: "Dublin", x: 482.5, y: 101.9 },
  { name: "Paris", x: 506.4, y: 114.2 },
  { name: "Berlin", x: 537, y: 108 },
  { name: "Madrid", x: 489.7, y: 137.8 },
];

const sourceDots = [
  { name: "Dhaka", x: 751, y: 183.9 },
  { name: "Kathmandu", x: 736.9, y: 173.1 },
  { name: "Delhi", x: 714.4, y: 170.6 },
];

const regions = [
  {
    name: "USA",
    count: 5,
    label: "Partner universities",
    cities: [
      ["Phoenix", 1],
      ["Chicago", 1],
      ["Boston", 2],
      ["Buffalo", 1],
    ],
    note: "From Phoenix to Boston — five campuses, one application pathway.",
  },
  {
    name: "Canada",
    count: 8,
    label: "Partner universities",
    cities: [
      ["Toronto", 3],
      ["Vancouver", 3],
      ["Montreal", 2],
    ],
    note: "Our home turf — Toronto, Vancouver, Montreal and beyond.",
  },
  {
    name: "Europe",
    count: 2,
    label: "Strategic partners",
    cities: [
      ["London", 2],
      ["Dublin", 1],
    ],
    note: "IDP & the British Council — trusted reach across 12+ countries.",
  },
];

const badges = [
  { title: "5 universities", sub: "USA", pos: { left: "21%", top: "41%" } },
  { title: "8 universities", sub: "Canada", pos: { left: "20%", top: "14%" } },
  { title: "2 strategic partners", sub: "Europe", pos: { left: "53.5%", top: "33%" } },
];

function arcPath(x2: number, y2: number) {
  const mx = (hub.x + x2) / 2;
  const my = Math.min(hub.y, y2) - Math.abs(x2 - hub.x) * 0.22;
  return `M${hub.x},${hub.y} Q${mx},${my} ${x2},${y2}`;
}

export function NetworkMap() {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] pb-[70px]">
      <div className="max-w-[1320px] mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
          <div>
            <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
              GLOBAL REACH
            </div>
            <h2
              className="font-display font-semibold tracking-[-0.01em] max-w-[560px]"
              style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
            >
              One bridge, two continents, fifty universities
            </h2>
          </div>
          <p className="text-[15px] max-w-[380px]" style={{ color: "var(--body)" }}>
            Every partner institution connects back to our Toronto hub — a single, trusted route into
            North American and European education.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5 md:gap-6 items-stretch">
          <div
            className="relative rounded-[28px] border border-line bg-white overflow-hidden"
            style={{ boxShadow: "0 24px 50px -34px rgba(18,32,67,0.22)" }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap px-7 md:px-8 pt-7 pb-3">
              <div>
                <div className="font-display font-semibold text-[15.5px]" style={{ color: "var(--ink)" }}>
                  Network map
                </div>
                <div className="font-mono text-[10px] tracking-[0.4px] uppercase mt-[3px]" style={{ color: "var(--body)" }}>
                  Partners &amp; connectivity
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="inline-flex items-center gap-[7px] text-[11px]" style={{ color: "var(--body)" }}>
                  <span className="w-[9px] h-[9px] rounded-full border-2 border-white" style={{ background: "var(--brand)", boxShadow: "0 0 0 1px var(--brand)" }} />
                  Partner university
                </span>
                <span className="inline-flex items-center gap-[7px] text-[11px]" style={{ color: "var(--body)" }}>
                  <span className="w-[9px] h-[9px] rounded-full border-2 border-white" style={{ boxShadow: "0 0 0 1px var(--brand-2)" }}>
                    <span className="block w-full h-full rounded-full" style={{ background: "var(--brand-2)" }} />
                  </span>
                  Strategic partner
                </span>
                <span className="inline-flex items-center gap-[7px] text-[11px]" style={{ color: "var(--body)" }}>
                  <span className="w-[16px] h-[2px] rounded-full" style={{ background: "var(--brand-2)", opacity: 0.6 }} />
                  Toronto hub link
                </span>
              </div>
            </div>

            <div className="relative px-4 md:px-6 pb-6">
              <svg viewBox="0 0 1000 500" className="w-full h-auto">
                <defs>
                  <pattern id="fb-dots" width="7" height="7" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1" fill="rgba(18,32,67,0.18)" />
                  </pattern>
                  <pattern id="fb-dots-brand" width="7" height="7" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(11,94,70,0.5)" />
                  </pattern>
                </defs>

                {muted.map((k) => (
                  <path key={k} d={land[k]} fill="url(#fb-dots)" />
                ))}

                {highlighted.map((k) => (
                  <g key={k}>
                    <path d={land[k]} fill="rgba(20,181,126,0.13)" stroke="rgba(11,94,70,0.22)" strokeWidth="1" strokeLinejoin="round" />
                    <path d={land[k]} fill="url(#fb-dots-brand)" />
                  </g>
                ))}

                {nodes
                  .filter((n) => !n.hub)
                  .map((n) => (
                    <path key={n.name} d={arcPath(n.x, n.y)} fill="none" stroke="var(--brand-2)" strokeOpacity="0.45" strokeWidth="1.2" className="fb-flow" />
                  ))}

                {reachDots.map((d) => (
                  <circle key={d.name} cx={d.x} cy={d.y} r="2.8" fill="rgba(18,32,67,0.35)" />
                ))}

                {sourceDots.map((d) => (
                  <circle key={d.name} cx={d.x} cy={d.y} r="2.8" fill="rgba(18,32,67,0.3)" />
                ))}

                {nodes.map((n) => (
                  <g key={n.name}>
                    {n.hub && (
                      <circle className="fb-map-ring" cx={n.x} cy={n.y} r="7" fill="none" stroke="var(--brand)" strokeWidth="1.4" />
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.hub ? 5.5 : 4}
                      fill={n.strategic ? "#ffffff" : "var(--brand)"}
                      stroke={n.strategic ? "var(--brand-2)" : "#ffffff"}
                      strokeWidth={n.strategic ? 1.6 : 2}
                    />
                    <g>
                      <rect x={n.x - 14} y={n.y + 8} width={28} height={16} rx={8} fill="#fff" stroke="var(--line)" />
                      <text
                        x={n.x}
                        y={n.y + 19.5}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill="var(--brand-2)"
                        fontFamily="var(--font-mono)"
                      >
                        ×{n.count}
                      </text>
                    </g>
                    <title>{`${n.name} — ${n.count} partner institution${n.count > 1 ? "s" : ""}`}</title>
                  </g>
                ))}
              </svg>

              <div className="pointer-events-none absolute inset-0">
                {badges.map((b) => (
                  <div
                    key={b.sub}
                    className="absolute hidden sm:flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-[7px]"
                    style={{ ...b.pos, boxShadow: "0 12px 24px -14px rgba(18,32,67,0.3)" }}
                  >
                    <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                    <span className="font-mono text-[10.5px] font-medium whitespace-nowrap" style={{ color: "var(--ink)" }}>
                      {b.title}
                    </span>
                    <span className="font-mono text-[9.5px] tracking-[0.3px] uppercase whitespace-nowrap" style={{ color: "var(--body)" }}>
                      {b.sub}
                    </span>
                  </div>
                ))}

                <div
                  className="absolute hidden sm:flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-[7px]"
                  style={{ left: "29.5%", top: "20%", boxShadow: "0 12px 24px -14px rgba(18,32,67,0.3)" }}
                >
                  <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--brand)", boxShadow: "0 0 0 4px rgba(15,169,104,0.18)" }} />
                  <div>
                    <div className="font-mono text-[8.5px] tracking-[0.5px] uppercase" style={{ color: "var(--brand-2)" }}>
                      Headquarters
                    </div>
                    <div className="text-[11px] font-medium leading-tight" style={{ color: "var(--ink)" }}>
                      Toronto hub
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-[28px] border border-line bg-white p-7 md:p-8 flex flex-col"
            style={{ boxShadow: "0 24px 50px -34px rgba(18,32,67,0.22)" }}
          >
            <div className="font-mono text-[10px] font-medium tracking-[0.4em] uppercase mb-7" style={{ color: "var(--brand-2)" }}>
              Network at a glance
            </div>

            <div className="flex flex-col gap-7">
              {regions.map((r) => (
                <div key={r.name}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display font-semibold text-[16px]" style={{ color: "var(--ink)" }}>
                      {r.name}
                    </span>
                    <span className="font-display font-semibold text-[clamp(26px,2.6vw,34px)] leading-none tracking-[-0.02em]" style={{ color: "var(--brand-2)" }}>
                      {r.count}
                    </span>
                    <span className="ml-auto font-mono text-[9.5px] tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>
                      {r.label}
                    </span>
                  </div>
                  <div className="mt-3 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--brand-soft)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(r.count / 8) * 100}%`, background: "linear-gradient(90deg, #0FA968, #14B57E)" }}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {r.cities.map(([city, c]) => (
                      <span
                        key={city}
                        className="font-mono text-[10.5px] px-3 py-[5px] rounded-full border"
                        style={{ borderColor: "var(--line)", color: "var(--body)" }}
                      >
                        {city}
                        <span className="font-medium" style={{ color: "var(--brand-2)" }}> ×{c}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-[12.5px] mt-2.5" style={{ color: "var(--body)" }}>
                    {r.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-7" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
                …and <span className="font-medium" style={{ color: "var(--ink)" }}>40+ more institutions</span> across
                the United States &amp; Canada.
              </p>
              <div className="flex items-center gap-2 mt-3.5">
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--brand)" }} />
                <span className="font-mono text-[10.5px] tracking-[0.4px] uppercase" style={{ color: "var(--body)" }}>
                  Source markets: Bangladesh · India · Nepal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
