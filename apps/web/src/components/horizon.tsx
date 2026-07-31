export function Horizon() {
  return (
    <div className="relative aspect-square max-w-[560px] ml-auto">
      <svg viewBox="0 0 500 500" className="w-full h-full">
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F2C98A" />
            <stop offset="100%" stopColor="#E8A94C" />
          </radialGradient>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5FD3C4" stopOpacity="0" />
            <stop offset="100%" stopColor="#5FD3C4" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <circle className="sun" cx="330" cy="150" r="46" fill="url(#sunGrad)" />

        <path className="layer-back" d="M0 330 Q 90 270 180 300 T 340 280 T 500 310 V500 H0 Z" fill="var(--deep-2)" opacity="0.7" />
        <path className="layer-front" d="M0 380 Q 110 330 230 360 T 500 350 V500 H0 Z" fill="var(--deep)" />

        <path
          className="path-line"
          d="M40 420 C 130 400, 160 330, 230 300 C 300 270, 300 200, 380 150"
          fill="none"
          stroke="var(--gold-soft)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="6 7"
          strokeDashoffset="1000"
        />

        <g className="waypoint wp1">
          <circle cx="40" cy="420" r="5" fill="var(--signal)" />
          <text x="52" y="424" className="waypoint-label">LEARN</text>
        </g>
        <g className="waypoint wp2">
          <circle cx="180" cy="335" r="5" fill="var(--signal)" />
          <text x="192" y="339" className="waypoint-label">APPLY</text>
        </g>
        <g className="waypoint wp3">
          <circle cx="290" cy="235" r="5" fill="var(--signal)" />
          <text x="302" y="239" className="waypoint-label">ARRIVE</text>
        </g>
        <g className="waypoint wp4">
          <circle cx="380" cy="150" r="6" fill="var(--gold)" />
          <text x="393" y="154" className="waypoint-label" fill="var(--gold-soft)">GROW</text>
        </g>
      </svg>

      <style>{`
        .sun {
          animation: riseSun 1.8s ease-out forwards;
          transform-origin: center;
        }
        @keyframes riseSun {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .path-line {
          animation: drawPath 2.6s 0.4s cubic-bezier(.4,0,.2,1) forwards;
        }
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        .waypoint {
          opacity: 0;
          transform-origin: center;
          animation: popIn 0.5s ease forwards;
        }
        .waypoint.wp1 { animation-delay: 0.9s; }
        .waypoint.wp2 { animation-delay: 1.5s; }
        .waypoint.wp3 { animation-delay: 2.1s; }
        .waypoint.wp4 { animation-delay: 2.7s; }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }
        .waypoint-label {
          font-family: var(--font-mono);
          font-size: 10.5px;
          fill: var(--mist);
          letter-spacing: 0.4px;
        }
        @media (prefers-reduced-motion: reduce) {
          .path-line, .waypoint, .sun {
            animation: none !important;
            stroke-dashoffset: 0;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
