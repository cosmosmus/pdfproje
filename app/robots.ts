import type { MetadataRoute } from "next";

// Vitrin is a private tool: neither the admin panel nor the gated document
// links should ever appear in search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
