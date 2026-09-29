export function Watermark({ text }: { text: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <span
        className="absolute whitespace-nowrap font-mono text-[11px] tracking-wide leading-tight"
        style={{
          color: "rgba(255,255,255,0.4)",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          animation: "flybridge-drifter 24s linear infinite",
        }}
      >
        {text}
      </span>
      <style jsx>{`
        @keyframes flybridge-drifter {
          0% {
            top: 6%;
            left: 4%;
          }
          20% {
            top: 72%;
            left: 58%;
          }
          40% {
            top: 24%;
            left: 66%;
          }
          60% {
            top: 84%;
            left: 18%;
          }
          80% {
            top: 46%;
            left: 78%;
          }
          100% {
            top: 6%;
            left: 4%;
          }
        }
      `}</style>
    </div>
  );
}
