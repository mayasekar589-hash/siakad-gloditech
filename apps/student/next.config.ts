import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  transpilePackages: ["@siakad/ui"],
  env: {
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL ?? process.env.WEBSITE_ORIGIN ?? "http://localhost:3002"
  }
};

export default nextConfig;