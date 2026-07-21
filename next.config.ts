import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.istikbal.com.tr" },
      { protocol: "https", hostname: "cdn.sugartech.io" },
    ],
  },
};

export default nextConfig;
