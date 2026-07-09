import type { NextConfig } from "next";

const PDF_RENDER_TRACE_INCLUDES = [
  "./node_modules/@napi-rs/canvas*/**",
  "./node_modules/pdfjs-dist/legacy/build/**",
  "./node_modules/pdfjs-dist/cmaps/**",
  "./node_modules/pdfjs-dist/standard_fonts/**",
  "./node_modules/pdfjs-dist/package.json",
];

const nextConfig: NextConfig = {
  // @napi-rs/canvas is pdfjs-dist'in Node'da DOMMatrix/canvas için ihtiyaç
  // duyduğu native modül — bundle edilemez.
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist", "@napi-rs/canvas"],
  // Vercel'in dosya izlemesi (nft) @napi-rs/canvas'ın platforma özel .node
  // binary'sini (dinamik require ile yüklenir) kaçırıyor; thumbnail üreten
  // route'ların fonksiyon paketine elle dahil et.
  // Anahtarlar picomatch ile eşleşir: [id] gibi segmentler kaçışlanmazsa
  // karakter sınıfı sayılır ve route hiç eşleşmez.
  // pdfjs-dist worker'ını dinamik import ile yüklediğinden nft onu göremiyor;
  // cmaps/standard_fonts da bazı PDF'ler için çalışma anında gerekiyor.
  outputFileTracingIncludes: {
    "/api/upload": PDF_RENDER_TRACE_INCLUDES,
    "/api/admin/documents/\\[id\\]/replace": PDF_RENDER_TRACE_INCLUDES,
    "/api/admin/documents/\\[id\\]/thumbnail/\\[page\\]": PDF_RENDER_TRACE_INCLUDES,
    "/api/documents/\\[slug\\]/thumbnail/\\[page\\]": PDF_RENDER_TRACE_INCLUDES,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
  // Eski maillerde /d/{slug} biçiminde link gitti; kalıcı olarak /doc'a yönlendir.
  async redirects() {
    return [
      {
        source: "/d/:slug",
        destination: "/doc/:slug",
        permanent: true,
      },
    ];
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
