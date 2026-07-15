import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root - an unrelated lockfile in a parent Downloads
  // folder otherwise makes Next.js guess the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
