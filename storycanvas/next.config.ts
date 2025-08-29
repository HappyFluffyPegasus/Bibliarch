import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: {
    optimizeCss: false,
  },
  webpack: (config: any) => {
    // Konva uses canvas for server-side rendering, but we only need client-side
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
