import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["app", "lib"],
  },
  // Disable specific ESLint rules
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
