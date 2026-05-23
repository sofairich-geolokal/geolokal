import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Turbopack root warning for deployment
  turbopack: {
    root: process.cwd(),
  },
  // Add cache configuration to prevent module instantiation issues
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
    // Configure server actions to prevent hash mismatch errors
    serverActions: {
      allowedOrigins: ['geo-lokal-final.vercel.app'],
      bodySizeLimit: '2mb',
    },
  },
  // Ensure proper module resolution
  transpilePackages: [],
  // Enable standalone output for Docker
  output: 'standalone',
};

export default nextConfig;
