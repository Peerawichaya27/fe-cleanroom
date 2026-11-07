import { resolve } from "node:path";
import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  distDir: process.env.E2E_MODE === "true" ? ".next-e2e" : ".next",
  outputFileTracingRoot: resolve("."),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      ...(process.env.MEDIA_HOST
        ? [{ protocol: "https" as const, hostname: process.env.MEDIA_HOST }]
        : []),
    ],
  },
};
export default config;
