import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FlyBridge Education Group";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(160deg, #0C162E 0%, #122043 55%, #14524C 130%)",
          color: "#FFFFFF",
          padding: "72px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img
            src="https://flybridgeedu.com/transparent-logo-light.png"
            alt=""
            width={220}
            height={80}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 6,
              color: "#14B57E",
              marginBottom: 18,
            }}
          >
            PRACTICAL COURSES FOR LIFE ABROAD
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -1,
              color: "#FFFFFF",
            }}
          >
            Study, work and build a career abroad — one confident step at a time.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 22, color: "#9AA6C2" }}>
          flybridgeedu.com
        </div>
      </div>
    ),
    { ...size }
  );
}
