import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Turbopack root warning for deployment
  turbopack: {
    root: process.cwd(),
  },
  // Add cache configuration to prevent module instantiation issues
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  // Ensure proper module resolution
  transpilePackages: [],
};

export default nextConfig;
