import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sim & Lucia",
    short_name: "Sim & Lucia",
    description: "Shared finance and budgeting",
    start_url: "/",
    display: "standalone",
    background_color: "#170b28",
    theme_color: "#170b28",
    icons: [{ src: "/icon.png", sizes: "1254x1254", type: "image/png", purpose: "any" }],
  };
}
