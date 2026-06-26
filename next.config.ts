import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // geoip-lite reads .dat files relative to its own __dirname at runtime;
  // bundling it breaks that path resolution, so keep it as a native require.
  serverExternalPackages: ["geoip-lite", "pdf-to-img", "pdfjs-dist"],
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
};

export default nextConfig;
