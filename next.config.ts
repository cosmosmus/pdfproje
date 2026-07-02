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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Browsers ignore HSTS over plain http, so this is safe in local dev too.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
