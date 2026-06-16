import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.102", "localhost"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "**.myanimelist.net" },
      { protocol: "https", hostname: "**.myanimelist.cdn-dena.com" },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
