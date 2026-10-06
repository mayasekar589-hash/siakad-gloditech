import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@siakad/ui"],
  env: {
    NEXT_PUBLIC_SIAKAD_URL: process.env.NEXT_PUBLIC_SIAKAD_URL ?? process.env.BACKOFFICE_ORIGIN ?? "http://localhost:3001",
    NEXT_PUBLIC_SIAKAD_TARUNA_URL: process.env.NEXT_PUBLIC_SIAKAD_TARUNA_URL
      ?? process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL
      ?? process.env.NEXT_PUBLIC_TARUNA_PORTAL_URL
      ?? process.env.NEXT_PUBLIC_STUDENT_URL
      ?? process.env.STUDENT_ORIGIN
      ?? "http://localhost:3000"
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
        pathname: "/wikipedia/commons/thumb/**"
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**"
      }
    ]
  }
};

export default nextConfig;
