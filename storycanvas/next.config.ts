import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: false,
  },
  webpack: (config: any, { dev, isServer }) => {
    // Completely isolate Konva from server-side and worker processing
    if (isServer || process.env.NODE_ENV === 'test') {
      // On server/workers, replace Konva with empty modules to prevent crashes
      config.resolve.alias = {
        ...config.resolve.alias,
        'konva': false,
        'react-konva': false,
      };
    } else {
      // Client-side: use normal Konva with fallbacks for any Node.js imports
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        canvas: false,
        'konva/lib/index-node.js': false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
