import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: [
      'ik.imagekit.io',
      'images.unsplash.com',]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase the limit for server actions
    },
    nodeMiddleware: true
  },
};

export default nextConfig;
