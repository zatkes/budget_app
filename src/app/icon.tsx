import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Same purple gradient + "S+L" mark used on the Home screen's avatar chip -
// generated at build/request time rather than shipping a static asset.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg,#4c2394,#7c3aed 55%,#a855f7)",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 200,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          S+L
        </div>
      </div>
    ),
    size,
  );
}
