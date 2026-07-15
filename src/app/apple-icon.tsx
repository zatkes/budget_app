import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS ignores manifest icons entirely and only reads this convention for the
// home-screen icon - same mark, no rounded corners (iOS applies its own mask).
export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 72,
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
