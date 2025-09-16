import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only set allowedDevOrigins if we're in Replit environment
  ...(process.env.REPLIT_DOMAINS && {
    allowedDevOrigins: [process.env.REPLIT_DOMAINS.split(",")[0]],
  }),
};

module.exports = nextConfig;
