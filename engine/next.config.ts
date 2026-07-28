import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logo and case-study slot uploads arrive as server-action form data;
      // the framework default of 1 MB rejects most real images.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
