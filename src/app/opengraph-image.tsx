import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 96, fontWeight: 700, color: "#fff" }}>
          MOVIE<span style={{ color: "#e50914" }}>X</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "rgba(255,255,255,0.7)" }}>
          Watch Movies Online Free
        </div>
      </div>
    ),
    size
  );
}
