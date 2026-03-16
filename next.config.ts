import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Turbopack root warning for deployment
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
